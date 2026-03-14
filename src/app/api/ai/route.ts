// src/app/api/ai/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { listTours } from '@/features/tours/catalog.server';
import { jsonError, contentLengthBytes } from '@/lib/apiErrors';
import {
  assertAllowedOriginOrReferer,
  getRequestChannel,
} from '@/lib/requestGuards.server';
import {
  ensureConversation,
  ensureLead,
  appendMessage,
  createOrReuseTicket,
  createOrReuseDeal,
  createTask,
} from '@/lib/botStorage.server';

import { formatPlaybookForPrompt, getEnabledPlaybookSnippets } from '@/lib/aiPlaybook.server';

import { getAllowedOrigins } from '@/lib/cors';
import { logEvent } from '@/lib/events.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { enforceCostBudget } from '@/lib/costBudget.server';
import { getRequestId } from '@/lib/requestId';
import { sanitizeText } from '@/lib/sanitize';
import { logSecurityEvent } from '@/lib/securityEvents.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 25;

const isProd = process.env.NODE_ENV === 'production';

// Keep these as constants so we don't rely on rl.limit (your type doesn't expose it)
const RL_MINUTE_LIMIT = 20;
const RL_HOUR_LIMIT = 120;

function parseTourSlugFromText(text: string): string | null {
  const s = String(text || '');
  const m = s.match(/\/tours\/([a-z0-9-]{2,160})/i);
  if (m?.[1]) return m[1].toLowerCase();
  const m2 = s.match(/\bslug\s*[:=]\s*([a-z0-9-]{2,160})\b/i);
  if (m2?.[1]) return m2[1].toLowerCase();
  return null;
}

function looksLikeBookingIntent(text: string): boolean {
  const s = String(text || '').toLowerCase();
  return /\b(reserv|book|pagar|checkout|comprar|buy|pago|payment)\b/.test(s);
}

/* ─────────────────────────────────────────────────────────────
   Itinerary tool — server-side execution
   ───────────────────────────────────────────────────────────── */

type ItineraryIntent = {
  city: string;
  days: number;
  interests: string[];
  budget: 'low' | 'mid' | 'high';
  pax: number;
  pace: 'relax' | 'balanced' | 'intense';
};

function detectItineraryIntent(text: string): ItineraryIntent | null {
  const s = String(text || '').toLowerCase();

  // Needs explicit plan/itinerary request AND city info
  const wantsPlan = /\b(plan|itinerario|días?|days?|arma|diseña|crea.*plan|plan.*días?|d[íi]as.*viaje)\b/i.test(s);
  if (!wantsPlan) return null;

  // Extract city
  const cityPatterns: Array<[string, string]> = [
    ['bogot[aá]', 'Bogotá'], ['medell[ií]n', 'Medellín'], ['cartagena', 'Cartagena'],
    ['\\bcali\\b', 'Cali'], ['santa\\s*marta', 'Santa Marta'],
    ['villa\\s*de\\s*leyva', 'Villa de Leyva'], ['salento', 'Salento'],
    ['guatar?[eé]', 'Guatapé'], ['mompox', 'Mompox'],
  ];
  let city = 'Bogotá';
  for (const [pattern, name] of cityPatterns) {
    if (new RegExp(pattern, 'i').test(s)) { city = name; break; }
  }
  // Simple city name scan if none matched
  if (city === 'Bogotá') {
    const cityMatch = s.match(/\ben\s+([a-záéíóúüñ\s]{3,20}?)(?:\s+(?:para|con|de|por|el|la|los|las|un|por)|\?|,|\.)/i);
    if (cityMatch?.[1]) city = cityMatch[1].trim();
  }

  // Extract days
  const daysMatch = s.match(/(\d+)\s*d[íi]as?/i) || s.match(/(\d+)\s*days?/i);
  const days = Math.min(Math.max(daysMatch?.[1] ? parseInt(daysMatch[1], 10) : 3, 1), 5);

  // Extract budget
  const budget: 'low' | 'mid' | 'high' =
    /\b(económico|barato|low|budget|econ[oó]mico)\b/i.test(s) ? 'low' :
    /\b(premium|lujo|luxury|alto|high|vip)\b/i.test(s) ? 'high' : 'mid';

  // Extract pax
  const paxMatch = s.match(/(\d+)\s*(persona[s]?|viajero[s]?|people|person)/i);
  const pax = Math.min(Math.max(paxMatch?.[1] ? parseInt(paxMatch[1], 10) : 2, 1), 20);

  // Extract pace
  const pace: 'relax' | 'balanced' | 'intense' =
    /\b(relajado|relax|tranquil)\b/i.test(s) ? 'relax' :
    /\b(intenso|intense|activo|active|full)\b/i.test(s) ? 'intense' : 'balanced';

  // Extract interests
  const interestPatterns: Array<[string, string]> = [
    ['caf[eé]', 'coffee'], ['cultur', 'culture'], ['histori', 'history'],
    ['natur', 'nature'], ['comid', 'food'], ['gastronom', 'food'],
    ['aventur', 'adventure'], ['playa', 'beach'], ['arte', 'culture'],
    ['museo', 'history'], ['noche', 'nightlife'],
  ];
  const interests: string[] = [];
  for (const [pattern, tag] of interestPatterns) {
    if (new RegExp(pattern, 'i').test(s) && !interests.includes(tag)) interests.push(tag);
  }
  if (!interests.length) interests.push('culture');

  return { city, days, interests, budget, pax, pace };
}

async function callItineraryTool(
  intent: ItineraryIntent,
  locale: string,
  signal: AbortSignal,
): Promise<string | null> {
  const GEMINI_KEY = (process.env.GEMINI_API_KEY ?? '').trim();
  const OPENAI_KEY = (process.env.OPENAI_API_KEY ?? '').trim();
  const GEMINI_MDL = (process.env.GEMINI_MODEL ?? 'gemini-2.0-flash').trim();
  const GEMINI_API = (process.env.GEMINI_API_URL ?? 'https://generativelanguage.googleapis.com').trim();

  const startDate = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const lang = locale.slice(0, 2).toLowerCase() === 'en' ? 'en' :
               locale.slice(0, 2).toLowerCase() === 'fr' ? 'fr' :
               locale.slice(0, 2).toLowerCase() === 'de' ? 'de' : 'es';

  const body = {
    city: intent.city,
    days: intent.days,
    date: startDate,
    interests: intent.interests,
    budget: intent.budget,
    pax: intent.pax,
    pace: intent.pace,
    language: lang,
  };

  // Try Gemini JSON
  if (GEMINI_KEY) {
    try {
      const url = `${GEMINI_API}/v1beta/models/${encodeURIComponent(GEMINI_MDL)}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
      const BUDGET_TABLE = { low: { min: 120_000, max: 220_000 }, mid: { min: 220_000, max: 420_000 }, high: { min: 420_000, max: 720_000 } };
      const band = BUDGET_TABLE[intent.budget];
      const systemPrompt = `Eres un Travel Planner de KCE. Genera un itinerario de ${intent.days} días en ${intent.city} en formato JSON estricto (sin backticks, sin texto extra). Schema: {"plan":{"city":"string","days":number,"budgetCOPPerPersonPerDay":{"min":number,"max":number},"itinerary":[{"day":number,"date":"YYYY-MM-DD","title":"string","summary":"string","blocks":[{"time":"HH:MM","title":"string","neighborhood":"string","description":"string","approx_cost_cop":number}],"safety":"string"}],"totals":{"approx_total_cop_per_person":number}},"marketing":{"copy":{"headline":"string","subhead":"string"}}}. Idioma: ${lang === 'en' ? 'English' : lang === 'fr' ? 'French' : lang === 'de' ? 'German' : 'Spanish'}. Presupuesto COP/día: ${band.min.toLocaleString()}–${band.max.toLocaleString()}.`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: JSON.stringify(body) }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 1400, responseMimeType: 'application/json' },
        }),
        signal,
      });
      if (r.ok) {
        const d = await r.json() as any;
        const raw = d?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('') ?? '';
        if (raw) return raw;
      }
    } catch { /* fallback */ }
  }

  // Fallback: call our own itinerary-builder endpoint
  try {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const r = await fetch(`${siteUrl}/api/itinerary-builder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (r.ok) {
      const d = await r.json() as any;
      if (d?.plan) return JSON.stringify({ plan: d.plan, marketing: d.marketing });
    }
  } catch { /* give up */ }

  return null;
}

function formatItineraryAsMarkdown(raw: string, locale: string): string {
  try {
    const d = JSON.parse(raw) as any;
    const plan = d?.plan ?? d;
    if (!plan?.itinerary?.length) return '';
    const lang = locale.slice(0, 2);
    const label = lang === 'en' ? 'Your Travel Plan' : lang === 'fr' ? 'Ton Plan de Voyage' : lang === 'de' ? 'Dein Reiseplan' : 'Tu Plan de Viaje';
    const safetyLabel = lang === 'en' ? 'Safety' : lang === 'fr' ? 'Sécurité' : lang === 'de' ? 'Sicherheit' : 'Seguridad';
    const totalLabel = lang === 'en' ? 'Total estimate' : lang === 'fr' ? 'Total estimé' : lang === 'de' ? 'Gesamtschätzung' : 'Total estimado';

    const lines: string[] = [`## ${label}`];
    const headline = d?.marketing?.copy?.headline;
    if (headline) lines.push(`*${headline}*`);
    lines.push('');

    if (plan.budgetCOPPerPersonPerDay) {
      const { min, max } = plan.budgetCOPPerPersonPerDay;
      lines.push(`💰 COP ${min.toLocaleString()} – ${max.toLocaleString()} / día / persona`);
      lines.push('');
    }

    for (const day of plan.itinerary) {
      lines.push(`**Día ${day.day} — ${day.title}** *(${day.date})*`);
      lines.push(day.summary);
      lines.push('');
      for (const block of (day.blocks ?? [])) {
        const cost = block.approx_cost_cop ? ` (~COP ${Number(block.approx_cost_cop).toLocaleString()})` : '';
        const hood = block.neighborhood ? ` · ${block.neighborhood}` : '';
        lines.push(`- **${block.time}${hood}** — ${block.title}${cost}`);
        lines.push(`  ${block.description}`);
      }
      if (day.safety) lines.push(`  🛡️ *${safetyLabel}: ${day.safety}*`);
      lines.push('');
    }

    if (plan.totals?.approx_total_cop_per_person) {
      lines.push(`💰 **${totalLabel}: ~COP ${plan.totals.approx_total_cop_per_person.toLocaleString()} / persona**`);
      lines.push('');
    }

    return lines.join('\n');
  } catch {
    return '';
  }
}

/* ─────────────────────────────────────────────────────────────
   Provider config
   ───────────────────────────────────────────────────────────── */
const OPENAI_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').trim();
const OPENAI_MODEL_DEFAULT = (
  process.env.OPENAI_MODEL ||
  process.env.NEXT_PUBLIC_AI_MODEL ||
  'gpt-4o-mini'
).trim();

const GEMINI_URL = (
  process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com'
).trim();
const GEMINI_MODEL_DEFAULT = (
  process.env.GEMINI_MODEL ||
  process.env.NEXT_PUBLIC_AI_MODEL ||
  'gemini-2.0-flash'
).trim();

type Provider = 'gemini' | 'openai' | 'fallback';

// Providers that can be selected/configured (exclude internal fallback).
type RealProvider = Exclude<Provider, 'fallback'>;
const normalizeProvider = (v?: string | null): RealProvider | null => {
  const s = String(v || '').trim().toLowerCase();
  return s === 'gemini' || s === 'openai' ? (s as RealProvider) : null;
};

const AI_PRIMARY: RealProvider = normalizeProvider(process.env.AI_PRIMARY) ?? 'gemini';
const AI_SECONDARY: RealProvider = normalizeProvider(process.env.AI_SECONDARY) ?? 'openai';

/* ─────────────────────────────────────────────────────────────
   CORS helpers
   ───────────────────────────────────────────────────────────── */
function corsHeaders(
  req: NextRequest,
  opts?: { allowHeaders?: string; methods?: string },
): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowed = getAllowedOrigins();
  const allowOrigin = origin && allowed.includes(origin) ? origin : (allowed[0] ?? '');

  const headers: Record<string, string> = {};
  if (allowOrigin) {
    headers['Access-Control-Allow-Origin'] = allowOrigin;
    headers['Vary'] = 'Origin';
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = opts?.methods ?? 'GET,POST,OPTIONS';
    headers['Access-Control-Allow-Headers'] =
      opts?.allowHeaders ??
      'Content-Type, Authorization, X-Request-ID, X-AI-Provider, X-AI-Model, X-Locale, X-Hint, X-Conversation-Id';
    headers['Access-Control-Max-Age'] = '86400';
  }
  return headers;
}

function corsPreflight(req: NextRequest, args: { methods: string; allowHeaders: string }) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders(req, { methods: args.methods, allowHeaders: args.allowHeaders }),
    },
  });
}

function json(
  req: NextRequest,
  data: unknown,
  status = 200,
  extraHeaders?: Record<string, string>,
) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders(req, {
        allowHeaders:
          'Content-Type, X-AI-Provider, X-AI-Model, X-Locale, X-Hint, X-Conversation-Id, Authorization, X-Request-ID',
      }),
      ...(extraHeaders || {}),
    },
  });
}

/* ─────────────────────────────────────────────────────────────
   Zod
   ───────────────────────────────────────────────────────────── */
const MsgSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1),
});

const Body = z.object({
  messages: z.array(MsgSchema).min(1).max(50),
  hint: z.string().max(280).optional(),
  locale: z.string().max(10).regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).optional(),

  conversationId: z.string().uuid().optional(),
  channel: z.enum(['webchat', 'whatsapp', 'email']).optional(),

  lead: z
    .object({
      email: z.string().email().optional(),
      whatsapp: z.string().min(6).optional(),
      source: z.string().min(1).max(50).regex(/^[a-z0-9_\-\.]{1,50}$/i).optional(),
    })
    .optional(),
  consent: z.literal(true).optional(),

  maxTokens: z.number().int().min(16).max(4096).optional(),
  temperature: z.number().min(0).max(2).optional(),
  model: z.string().min(1).max(100).optional(),
  provider: z.enum(['gemini', 'openai']).optional(),
});

function sanitizeHistory(incoming: z.infer<typeof MsgSchema>[]) {
  const filtered = incoming.filter((m) => m.role !== 'system');
  const last = filtered.slice(-16).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content.slice(0, 4000),
  }));
  return last.filter((m) => m.content.trim().length > 0);
}

function toGeminiContents(history: Array<{ role: 'user' | 'assistant'; content: string }>) {
  return history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

function detectLocale(req: NextRequest, explicit?: string | null) {
  if (explicit && explicit.trim()) return explicit.trim();
  const h =
    req.headers.get('x-locale') ||
    (req.headers.get('accept-language') || '').split(',')[0] ||
    '';
  return h.trim() || 'es-CO';
}

function langFromLocale(locale: string): string {
  const l = (locale || '').toLowerCase();
  if (l.startsWith('en')) return 'en';
  if (l.startsWith('fr')) return 'fr';
  if (l.startsWith('de')) return 'de';
  return 'es';
}

function buildFallbackAssistant(locale: string, catalogSummary: string): string {
  const lang = langFromLocale(locale);
  const lines = String(catalogSummary || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6)
    .join('\n');

  if (lang === 'en') {
    return [
      '## Status',
      "I'm having trouble connecting to our AI right now (or it's not configured yet).",
      '',
      '## Options',
      lines || '- Explore our tours catalog',
      '',
      '## Next step',
      'If you tell me your city, dates and number of travelers, I can still help you choose the best option.',
    ].join('\n');
  }

  if (lang === 'fr') {
    return [
      '## Status',
      "Je n'arrive pas à contacter notre IA en ce moment (ou elle n'est pas encore configurée).",
      '',
      '## Options',
      lines || '- Voir le catalogue de tours',
      '',
      '## Next step',
      'Dites-moi la ville, les dates et le nombre de personnes et je vous aide à choisir.',
    ].join('\n');
  }

  if (lang === 'de') {
    return [
      '## Status',
      'Ich kann unsere KI gerade nicht erreichen (oder sie ist noch nicht konfiguriert).',
      '',
      '## Options',
      lines || '- Tour-Katalog ansehen',
      '',
      '## Next step',
      'Sag mir Stadt, Daten und Personenzahl, dann helfe ich dir bei der Auswahl.',
    ].join('\n');
  }

  return [
    '## Estado',
    'En este momento no puedo contactar la IA (o aún no está configurada).',
    '',
    '## Opciones',
    lines || '- Ver catálogo de tours',
    '',
    '## Siguiente paso',
    'Dime ciudad, fechas y número de personas y te ayudo a elegir la mejor opción.',
  ].join('\n');
}

async function buildCatalogPromptLines() {
  const res = await listTours({ sort: 'popular', limit: 20, offset: 0 });
  const items = res.items ?? [];

  const cities = Array.from(
    new Set(items.map((t) => String((t as any).city ?? '').trim()).filter(Boolean)),
  ).join(', ');

  const summary = items
    .map((t) => {
      const city = String((t as any).city ?? 'Colombia').trim() || 'Colombia';
      const hours = (t as any).duration_hours ?? (t as any).durationHours;
      const hoursText = typeof hours === 'number' && Number.isFinite(hours) ? `${hours}h` : '';
      const priceMinor = (t as any).base_price ?? (t as any).price ?? null;
      const priceText =
        typeof priceMinor === 'number' && Number.isFinite(priceMinor) && priceMinor > 0
          ? `desde €${(priceMinor / 100).toFixed(0)}`
          : 'precio a consultar';
      const slug = String((t as any).slug || '').trim();
      const meta = [city, hoursText].filter(Boolean).join(' • ');
      return `- ${String((t as any).title || 'Tour').trim()} (${slug}) — ${
        meta ? `${meta} • ` : ''
      }${priceText}`;
    })
    .join('\n');

  return { cities: cities || 'Bogotá, Cartagena, Medellín', summary, source: (res as any).source };
}

function buildSystemPrompt(args: { locale: string; hint?: string; cities: string; summary: string }) {
  const { locale, hint, cities, summary } = args;

  const baseLines = [
    // ── IDENTIDAD ──────────────────────────────────────────────────────────
    'Eres el Concierge AI de KCE (Knowing Cultures Enterprise), agencia de turismo cultural premium en Colombia.',
    `Modelo principal: Gemini. Ciudades del catálogo: ${cities}.`,
    'Tu rol: ayudar al viajero a encontrar la experiencia correcta, armar itinerarios, y guiarlo al siguiente paso real — sin presión y sin jerga de ventas.',
    '',
    // ── CATÁLOGO ───────────────────────────────────────────────────────────
    'CATÁLOGO ACTUAL:',
    summary || '(catálogo no disponible en este momento)',
    '',
    // ── CAPACIDADES DEL AGENTE ─────────────────────────────────────────────
    'CAPACIDADES — lo que puedes hacer:',
    '1. RECOMENDAR tours del catálogo por ciudad, estilo y presupuesto.',
    '2. ARMAR un plan de viaje: cuando el viajero da ciudad + días + fechas, describe el itinerario día a día con bloques de actividad, costos aproximados en COP y consejos de seguridad.',
    '3. REDIRIGIR al formulario /plan cuando necesiten un plan detallado generado por IA con PDF.',
    '4. ABRIR TICKET de soporte y hacer handoff a humano cuando el caso lo requiera.',
    '5. CAPTURAR CONTACTO: nombre, email, whatsapp, fechas y presupuesto para que el equipo dé seguimiento.',
    '',
    // ── DESCUBRIMIENTO ─────────────────────────────────────────────────────
    'DESCUBRIMIENTO:',
    '- Máx 1 pregunta por mensaje. Si ya sabes ciudad + intereses, recomienda o arma el plan directamente.',
    '- No repitas preguntas del hilo. Usa todo lo que el usuario ya dijo.',
    '- Si piden un itinerario completo de varios días, usa tu capacidad #2 y genera el plan ahora mismo.',
    '',
    // ── FORMATO ────────────────────────────────────────────────────────────
    'FORMATO — secciones en orden cuando corresponda:',
    '## Resumen → 1-2 frases. Máx 25 palabras.',
    '## Opciones → para tours (máx 3):',
    '  **[Nombre] ([slug])**',
    '  Ciudad: X | Duración: X h | Precio: desde X EUR',
    '  Ideal para: [1 frase] | Por qué encaja: [1-2 frases]',
    '## Plan día a día → cuando armes un itinerario:',
    '  **Día 1 — [Tema]** ([fecha si la dan])',
    '  - [08:00] Actividad — Barrio X (~COP 0 / entrada libre)',
    '  - [11:00] Actividad — Barrio Y (~COP 25.000)',
    '  - [14:00] Almuerzo en [Zona] (~COP 35.000)',
    '  - [16:00] Tour KCE recomendado: **[Nombre] ([slug])** → [URL]',
    '  🛡️ Seguridad: [consejo breve]',
    '## Siguiente paso → 1 acción concreta. Máx 15 palabras.',
    '## Continuidad → solo si hay handoff o captura de contacto.',
    '',
    // ── LONGITUD ───────────────────────────────────────────────────────────
    'LONGITUD: 40-120 palabras fuera de bloques estructurados. Sin muros de texto.',
    'Primera respuesta: directa y corta. Profundiza solo si el usuario lo pide.',
    '',
    // ── REGLAS DE TOUR ─────────────────────────────────────────────────────
    'TOURS:',
    '- Solo tours del catálogo arriba. Nunca inventes tours.',
    '- Siempre incluye el slug entre paréntesis: "Coffee Culture (bogota-coffee-culture)".',
    '- Para precios usa "desde X EUR" o "aprox. X EUR". Nunca cifras exactas garantizadas.',
    '',
    // ── CASOS ESPECIALES ───────────────────────────────────────────────────
    'CASOS ESPECIALES:',
    '- Cierre/reserva: pide slug + fecha + nº personas + email. Genera link de checkout si es posible.',
    '- Objeción: empatía breve + alternativa concreta + sin presión.',
    '- Soporte/problema: disculpa + confirma datos + abre ticket + siguiente paso claro.',
    '- Humano solicitado: resume el contexto + ofrece contacto. Sin promesas de tiempo.',
    '- Plan completo pedido: genera el itinerario día a día ahora mismo en el chat.',
    '',
    // ── LÍMITES ────────────────────────────────────────────────────────────
    'LÍMITES DUROS — NUNCA:',
    '- Prometer disponibilidad o fecha confirmada sin verificar con el equipo.',
    '- Dar precios exactos sin "aprox." o "desde".',
    '- Procesar refunds, cancelaciones o cambios de precio de forma autónoma.',
    '- Tomar decisiones administrativas sin confirmación humana.',
    '- Inventar tours, destinos o servicios que no están en el catálogo.',
  ];

  const langLine = (() => {
    const l = langFromLocale(locale);
    if (l === 'en') return 'Respond in English.';
    if (l === 'fr') return 'Réponds en français.';
    if (l === 'de') return 'Antworte auf Deutsch.';
    return 'Responde en español.';
  })();

  const hintLine = hint ? `Contexto interno: ${hint}` : '';

  return [...baseLines, langLine, hintLine].filter(Boolean).join('\n\n');
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function shouldHandoffHuman(userText: string): boolean {
  const t = (userText || '').toLowerCase();
  if (!t) return false;

  const keywords = [
    'humano',
    'persona',
    'agente',
    'soporte',
    'reembolso',
    'refund',
    'devolver',
    'chargeback',
    'fraude',
    'estafa',
    'queja',
    'reclamo',
    'denuncia',
    'no me funciona',
    'error de pago',
    'pago falló',
    'pago fallo',
    'no puedo pagar',
    'tarjeta',
    'cobro doble',
    'cobraron dos veces',
    'cancelar',
    'cancelación',
    'cancelacion',
  ];

  return keywords.some((k) => t.includes(k));
}

function handoffAppendix(locale: string, ticketId: string) {
  const lang = (locale || 'es').slice(0, 2).toLowerCase();
  const localePrefix = `/${lang === 'en' || lang === 'fr' || lang === 'de' ? lang : 'es'}`;
  const contactHref = `${localePrefix}/contact?source=chat-handoff&ticket=${encodeURIComponent(ticketId)}`;
  if (lang === 'en')
    return `\n\n## Continuity\nI created a support ticket (**#${ticketId.slice(0, 8)}**) so a human agent can help you. If you want to continue outside the chat, open [Contact](${contactHref}) with this context.`;
  if (lang === 'fr')
    return `\n\n## Continuité\nJ’ai créé un ticket de support (**#${ticketId.slice(0, 8)}**) pour qu’un agent humain puisse vous aider. Si vous souhaitez poursuivre hors du chat, ouvrez [Contact](${contactHref}) avec ce contexte.`;
  if (lang === 'de')
    return `\n\n## Kontinuität\nIch habe ein Support-Ticket (**#${ticketId.slice(0, 8)}**) erstellt, damit ein menschlicher Agent dir helfen kann. Wenn du außerhalb des Chats weitermachen willst, öffne [Kontakt](${contactHref}) mit diesem Kontext.`;
  return `\n\n## Continuidad\nHe creado un ticket de soporte (**#${ticketId.slice(0, 8)}**) para que un agente humano te ayude. Si quieres seguir fuera del chat, abre [Contacto](${contactHref}) con este contexto.`;
}

function providerOrder(force?: RealProvider | '' | null): RealProvider[] {
  const forced = normalizeProvider(force || null);
  if (forced) return [forced];
  return Array.from(new Set<RealProvider>([AI_PRIMARY, AI_SECONDARY].filter(Boolean) as RealProvider[]));
}

const allowedModels = new Set(
  (process.env.AI_ALLOWED_MODELS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

function pickModel(clientModel: string | undefined, fallback: string) {
  const m = (clientModel || '').trim();
  if (!m) return fallback;
  if (!isProd) return m;
  if (allowedModels.size === 0) return fallback;
  return allowedModels.has(m) ? m : fallback;
}

/* ─────────────────────────────────────────────────────────────
   Providers
   ───────────────────────────────────────────────────────────── */
async function callGemini(args: {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  signal: AbortSignal;
  maxTokens?: number;
  temperature?: number;
}) {
  const { apiKey, baseUrl, model, systemPrompt, history, signal, maxTokens, temperature } = args;
  const url = `${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const payload = {
    contents: toGeminiContents(history),
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      candidateCount: 1,
      ...(typeof maxTokens === 'number' ? { maxOutputTokens: maxTokens } : {}),
    },
  };

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!r.ok) throw new Error(`gemini ${r.status}`);
  const data = (await r.json()) as any;

  const content =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('')?.trim() || '';
  if (!content) throw new Error('gemini empty');
  return { content, model };
}

async function callOpenAIChatCompletions(args: {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  signal: AbortSignal;
  maxTokens?: number;
  temperature?: number;
}) {
  const { apiKey, baseUrl, model, systemPrompt, history, signal, maxTokens, temperature } = args;

  const body = {
    model,
    messages: [{ role: 'system', content: systemPrompt }, ...history],
    temperature: typeof temperature === 'number' ? temperature : 0.7,
    ...(typeof maxTokens === 'number' ? { max_tokens: maxTokens } : {}),
  };

  const r = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal,
  });

  if (!r.ok) throw new Error(`openai ${r.status}`);
  const data = (await r.json()) as {
    choices?: { message?: { content?: string } }[];
    model?: string;
  };

  const content = data?.choices?.[0]?.message?.content?.trim() ?? '';
  if (!content) throw new Error('openai empty');
  return { content, model: data?.model || model };
}

/* ─────────────────────────────────────────────────────────────
   GET (health) — recomendado solo en DEV
   ───────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const originErr = assertAllowedOriginOrReferer(req, { allowInternalHmac: true, allowMissing: false });
  if (originErr) return originErr;

  if (isProd) {
    return new NextResponse(null, {
      status: 404,
      headers: corsHeaders(req, {
        allowHeaders:
          'Content-Type, X-AI-Provider, X-AI-Model, X-Locale, X-Hint, X-Conversation-Id, Authorization, X-Request-ID',
      }),
    });
  }

  const reqId = getRequestId(req.headers);

  const clen = contentLengthBytes(req);
  if (clen && clen > 96_000) {
    return jsonError(req, {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Payload too large.',
      requestId: reqId,
    });
  }

  return json(
    req,
    {
      ok: true,
      primary: AI_PRIMARY,
      secondary: AI_SECONDARY,
      defaults: { openai: OPENAI_MODEL_DEFAULT, gemini: GEMINI_MODEL_DEFAULT },
      configured: {
        openai: Boolean((process.env.OPENAI_API_KEY || '').trim()),
        gemini: Boolean((process.env.GEMINI_API_KEY || '').trim()),
      },
    },
    200,
    { 'X-Request-ID': reqId, 'X-Powered-By': 'KCE-AI' },
  );
}

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req, {
    methods: 'GET,POST,OPTIONS',
    allowHeaders:
      'Content-Type, X-AI-Provider, X-AI-Model, X-Locale, X-Hint, X-Conversation-Id, Authorization, X-Request-ID',
  });
}

/* ─────────────────────────────────────────────────────────────
   POST (chat)
   ───────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const originErr = assertAllowedOriginOrReferer(req, { allowInternalHmac: true, allowMissing: false });
  if (originErr) return originErr;

  const reqId = getRequestId(req.headers);

  const channel = getRequestChannel(req);

  const clen = contentLengthBytes(req);
  if (clen && clen > 96_000) {
    return jsonError(req, {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Payload too large.',
      requestId: reqId,
    });
  }

  // Fine-grained rate limiting: burst (per minute) + sustained (per hour)
  const rlMinute = await checkRateLimit(req, {
    action: `ai.chat.${channel}.m`,
    limit: RL_MINUTE_LIMIT,
    windowSeconds: 60,
    identity: 'ip+vid',
  });

  if (!rlMinute.allowed) {
    void logSecurityEvent(req, {
      severity: 'warn',
      kind: 'rate_limit',
      meta: { route: '/api/ai', scope: `ai.chat.${channel}.m`, keyBase: rlMinute.keyBase },
    });
    void logEvent('api.rate_limited', {
      request_id: reqId,
      route: '/api/ai',
      action: `ai.chat.${channel}.m`,
      key_base: rlMinute.keyBase,
    });
    return jsonError(req, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
      requestId: reqId,
      headers: {
        'Retry-After': String(rlMinute.retryAfterSeconds ?? 30),
        'X-RateLimit-Limit': String(RL_MINUTE_LIMIT),
        'X-RateLimit-Remaining': String(rlMinute.remaining ?? 0),
      },
    });
  }

  const rl = await checkRateLimit(req, {
    action: `ai.chat.${channel}.h`,
    limit: RL_HOUR_LIMIT,
    windowSeconds: 3600,
    identity: 'ip+vid',
  });

  if (!rl.allowed) {
    void logEvent('api.rate_limited', {
      request_id: reqId,
      route: '/api/ai',
      action: `ai.chat.${channel}.h`,
      key_base: rl.keyBase,
    });
    void logSecurityEvent(req, {
      severity: 'warn',
      kind: 'rate_limit',
      meta: { route: '/api/ai', scope: `ai.chat.${channel}.h`, keyBase: rl.keyBase },
    });
    return jsonError(req, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
      requestId: reqId,
      headers: {
        'Retry-After': String(rl.retryAfterSeconds ?? 30),
        'X-RateLimit-Limit': String(RL_HOUR_LIMIT),
        'X-RateLimit-Remaining': String(rl.remaining ?? 0),
      },
    });
  }

  const budget = await enforceCostBudget(req, 'ai');
  if (!budget.allowed) {
    return jsonError(req, {
      status: 429,
      code: 'BUDGET_EXCEEDED',
      message: 'Daily AI budget exceeded. Try again later.',
      requestId: reqId,
    });
  }

  const { searchParams } = new URL(req.url);
  const forceFromQueryOrHeader = (
    searchParams.get('provider') ??
    req.headers.get('x-ai-provider') ??
    ''
  )
    .toLowerCase()
    .trim() as RealProvider | '' | null;

  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

  let parsed: z.infer<typeof Body>;
  try {
    const raw = await req.json();
    const check = Body.safeParse(raw);
    if (!check.success) {
      return json(
        req,
        { error: 'Invalid body', details: check.error.flatten(), requestId: reqId },
        400,
        { 'X-Request-ID': reqId },
      );
    }
    parsed = check.data;
  } catch {
    return json(req, { error: 'Invalid JSON', requestId: reqId }, 400, { 'X-Request-ID': reqId });
  }

  const headerHint = (req.headers.get('x-hint') || '').trim();
  const locale = detectLocale(req, parsed.locale);
  const hint = parsed.hint || headerHint || undefined;

  const catalog = await buildCatalogPromptLines();

  const baseSystemPrompt = hint
    ? buildSystemPrompt({ locale, hint, cities: catalog.cities, summary: catalog.summary })
    : buildSystemPrompt({ locale, cities: catalog.cities, summary: catalog.summary });

  // P7: Inject human-approved “playbook snippets” for consistency.
  // If the table/patch is not installed yet, this is a no-op.
  const playbookText = formatPlaybookForPrompt(await getEnabledPlaybookSnippets({ limit: 12 }));
  const systemPrompt = playbookText ? `${baseSystemPrompt}\n\n${playbookText}` : baseSystemPrompt;

  const history = sanitizeHistory(parsed.messages);

  const order = providerOrder(parsed.provider ?? forceFromQueryOrHeader);

  if (order.length === 0) {
    return json(req, { error: 'No provider configured', requestId: reqId }, 503, {
      'X-Request-ID': reqId,
    });
  }

  const cookieCid = req.cookies.get('kce_chat_cid')?.value || null;
  const incomingCid =
    (parsed.conversationId || req.headers.get('x-conversation-id') || cookieCid || '').trim() || null;

  const leadId = await ensureLead({
    email: parsed.lead?.email ?? null,
    whatsapp: parsed.lead?.whatsapp ?? null,
    source: parsed.lead?.source ?? 'chat',
    language: langFromLocale(locale),
    consent: Boolean(parsed.consent),
    requestId: reqId,
  });

  const conversationId = await ensureConversation({
    conversationId: incomingCid,
    leadId,
    channel: parsed.channel ?? 'webchat',
    language: langFromLocale(locale),
    requestId: reqId,
  });

  const lastUser = sanitizeText(
    [...history].reverse().find((m) => m.role === 'user')?.content || '',
    1200,
  );
  const wantsHuman = shouldHandoffHuman(lastUser);

  if (lastUser) {
    void appendMessage({
      conversationId,
      role: 'user',
      content: lastUser,
      meta: { requestId: reqId, locale, hint: hint ?? null },
      requestId: reqId,
    });
  }

  const maxTokens = isProd ? undefined : parsed.maxTokens;
  const temperature = isProd ? undefined : parsed.temperature;

  const controller = new AbortController();
  const timeoutMs = 25_000;
  const t0 = Date.now();
  const kill = setTimeout(() => controller.abort(), timeoutMs);

  const attempts: Array<{ provider: Provider; ok: boolean; ms: number; error?: string }> = [];

  try {
    let finalContent = '';
    let finalProvider: Provider | null = null;
    let finalModel = '';

    for (const prov of order) {
      const start = Date.now();
      try {
        if (prov === 'gemini') {
          if (!geminiKey) {
            attempts.push({ provider: prov, ok: false, ms: Date.now() - start, error: 'gemini key missing' });
            continue;
          }

          const mdl = pickModel(parsed.model, GEMINI_MODEL_DEFAULT);
          const { content } = await callGemini({
            apiKey: geminiKey,
            baseUrl: GEMINI_URL,
            model: mdl,
            systemPrompt,
            history,
            signal: controller.signal,
            ...(typeof maxTokens === 'number' ? { maxTokens } : {}),
            ...(typeof temperature === 'number' ? { temperature } : {}),
          });

          attempts.push({ provider: prov, ok: true, ms: Date.now() - start });
          finalContent = content;
          finalProvider = 'gemini';
          finalModel = mdl;
          break;
        }

        if (!openaiKey) {
          attempts.push({ provider: prov, ok: false, ms: Date.now() - start, error: 'openai key missing' });
          continue;
        }

        const mdl = pickModel(parsed.model, OPENAI_MODEL_DEFAULT);
        const { content, model: usedModel } = await callOpenAIChatCompletions({
          apiKey: openaiKey,
          baseUrl: OPENAI_URL,
          model: mdl,
          systemPrompt,
          history,
          signal: controller.signal,
          ...(typeof maxTokens === 'number' ? { maxTokens } : {}),
          ...(typeof temperature === 'number' ? { temperature } : {}),
        });

        attempts.push({ provider: prov, ok: true, ms: Date.now() - start });
        finalContent = content;
        finalProvider = 'openai';
        finalModel = usedModel;
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        attempts.push({ provider: prov, ok: false, ms: Date.now() - start, error: msg });
      }
    }
    if (!finalContent || !finalProvider) {
      // Graceful fallback (no 502 in the UI).
      finalContent = buildFallbackAssistant(locale, catalog.summary);
      finalProvider = 'fallback';
      finalModel = 'fallback';
      attempts.push({ provider: 'fallback', ok: true, ms: Date.now() - t0, error: 'providers_failed' });
    }

    // ── Itinerary tool: if user asks for a plan, build it server-side ──────
    const itineraryIntent = detectItineraryIntent(lastUser);
    if (itineraryIntent && finalProvider !== 'fallback') {
      try {
        const raw = await callItineraryTool(itineraryIntent, locale, controller.signal);
        if (raw) {
          const planMd = formatItineraryAsMarkdown(raw, locale);
          if (planMd) {
            // Prepend the plan to the assistant response so it appears first
            finalContent = planMd + '\n\n' + finalContent;
          }
        }
      } catch {
        // best-effort — don't break the chat if itinerary fails
      }
    }

    // CRM (Deals/Tasks): crea o reutiliza un deal cuando detecta intención de compra/reserva.
    try {
      const tourSlug = parseTourSlugFromText(lastUser);
      const bookingIntent = looksLikeBookingIntent(lastUser);
      if (bookingIntent && leadId && tourSlug) {
        const stage = /\b(pagar|checkout|payment|pay)\b/i.test(lastUser) ? 'checkout' : 'proposal';

        const { dealId } = await createOrReuseDeal({
          leadId,
          tourSlug,
          title: `Booking: ${tourSlug}`,
          stage,
          source: 'chat',
          notes: `Auto from chat. Intent=${stage}.`,
          requestId: reqId,
        });

        if (dealId) {
          const due = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          await createTask({
            dealId,
            title: `Follow-up booking details for ${tourSlug}`,
            priority: stage === 'checkout' ? 'high' : 'normal',
            dueAt: due,
            requestId: reqId,
          });
        }
      }
    } catch {
      // best-effort
    }

    // Optional: handoff humano (tickets)
    let ticketId: string | null = null;
    if (wantsHuman) {
      if (leadId && isUuid(conversationId)) {
        const sum = `Handoff requested. User said: ${lastUser}`.slice(0, 2000);
        const t = await createOrReuseTicket({
          conversationId,
          leadId,
          summary: sum,
          priority: 'high',
          requestId: reqId,
        });
        ticketId = t.ticketId;
        if (ticketId) finalContent += handoffAppendix(locale, ticketId);
      } else {
        const lang = (locale || 'es').slice(0, 2).toLowerCase();
        const msg =
          lang === 'en'
            ? `\n\n---\nIf you want a human agent to help you, please share your email or WhatsApp and consent to be contacted.`
            : lang === 'fr'
              ? `\n\n---\nSi vous souhaitez qu’un agent humain vous aide, partagez votre email ou WhatsApp et votre consentement.`
              : lang === 'de'
                ? `\n\n---\nWenn du menschlichen Support möchtest, teile bitte deine E-Mail oder WhatsApp sowie dein Einverständnis.`
                : `\n\n---\nSi quieres que un humano te ayude, compártenos tu email o WhatsApp y tu consentimiento para contactarte.`;
        finalContent += msg;
      }
    }

    // Persist assistant message (best-effort)
    void appendMessage({
      conversationId,
      role: 'assistant',
      content: finalContent,
      meta: { requestId: reqId, provider: finalProvider, model: finalModel, locale },
      requestId: reqId,
    });

    const resp = json(
      req,
      {
        content: finalContent,
        provider: finalProvider,
        model: finalModel,
        locale,
        conversationId,
        ticketId,
        ms: Date.now() - t0,
        ...(isProd ? {} : { attempts, catalogSource: catalog.source }),
        requestId: reqId,
      },
      200,
      {
        'X-Request-ID': reqId,
        'X-AI-Provider': finalProvider,
        'X-AI-Model': finalModel,
        'X-Powered-By': 'KCE-AI',
      },
    );

    try {
      (resp as any).cookies?.set?.('kce_chat_cid', conversationId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    } catch {
      // ignore
    }

    return resp;
  } catch (e) {
    const aborted = controller.signal.aborted;
    return json(
      req,
      {
        error: aborted ? 'Request timed out' : e instanceof Error ? e.message : 'Unknown error',
        ...(isProd ? {} : { attempts }),
        ms: Date.now() - t0,
        requestId: reqId,
      },
      aborted ? 504 : 500,
      { 'X-Request-ID': reqId },
    );
  } finally {
    clearTimeout(kill);
  }
}
