// src/app/api/itinerary-builder/route.ts
import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { listTours } from '@/features/tours/catalog.server';
import { TOURS } from '@/features/tours/data.mock';
import { contentLengthBytes, jsonError } from '@/lib/apiErrors';
import { SITE_URL } from '@/lib/env';
import { checkRateLimit } from '@/lib/rateLimit.server';

export const runtime = 'nodejs';
export const maxDuration = 25;
export const dynamic = 'force-dynamic';

/* ─────────────────────────────────────────────────────────────
   Provider config (env + defaults)
   ───────────────────────────────────────────────────────────── */
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').trim();
const OPENAI_MODEL = (
  process.env.OPENAI_MODEL ??
  process.env.NEXT_PUBLIC_AI_MODEL ??
  'gpt-4o-mini'
).trim();
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY ?? '').trim();

const GEMINI_API_URL = (
  process.env.GEMINI_API_URL ?? 'https://generativelanguage.googleapis.com'
).trim();
const GEMINI_MODEL = (process.env.GEMINI_MODEL ?? 'gemini-2.0-flash').trim();
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY ?? '').trim();

type Provider = 'gemini' | 'openai';

function normalizeProvider(v?: string | null): Provider | null {
  const s = String(v ?? '')
    .trim()
    .toLowerCase();
  return s === 'gemini' || s === 'openai' ? (s as Provider) : null;
}

const AI_PRIMARY = normalizeProvider(process.env.AI_PRIMARY) ?? 'gemini';
const AI_SECONDARY = normalizeProvider(process.env.AI_SECONDARY) ?? 'openai';

/* ─────────────────────────────────────────────────────────────
   URL base (para links)
   ───────────────────────────────────────────────────────────── */
function baseUrl() {
  return (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
    /\/+$/,
    '',
  );
}

/* ─────────────────────────────────────────────────────────────
   CORS helpers (dinámico por Origin)
   ───────────────────────────────────────────────────────────── */
function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;

  // Permite mismo origen que SITE_URL / NEXT_PUBLIC_SITE_URL
  const allowed = [SITE_URL, process.env.NEXT_PUBLIC_SITE_URL]
    .map((x) => (x ?? '').trim())
    .filter(Boolean)
    .map((x) => x.replace(/\/+$/, ''));

  return allowed.some((a) => origin.replace(/\/+$/, '') === a);
}

function corsHeaders(req: NextRequest): HeadersInit {
  const origin = req.headers.get('origin');
  const allowOrigin = isAllowedOrigin(origin) ? (origin as string) : baseUrl();

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers':
      req.headers.get('access-control-request-headers') ??
      'content-type, authorization, x-ai-provider',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function corsPreflight(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

function json(req: NextRequest, data: unknown, status = 200, extra: HeadersInit = {}) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders(req),
      ...extra,
    },
  });
}

export function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

/* ─────────────────────────────────────────────────────────────
   Utils de fecha / inputs (robustos)
   ───────────────────────────────────────────────────────────── */
function isValidISODate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime());
}

function isTodayOrFutureUTC(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return d.getTime() >= todayUTC.getTime();
}

function withinNextMonthsUTC(date: string, months = 18) {
  const d = new Date(`${date}T00:00:00Z`);
  const now = new Date();
  const max = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  max.setUTCMonth(max.getUTCMonth() + months);
  return d.getTime() <= max.getTime();
}

function deAccent(s: string) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function sanitizeInterests(list: string[]) {
  const norm = list
    .map((s) =>
      deAccent(
        String(s || '')
          .trim()
          .toLowerCase(),
      ),
    )
    .filter(Boolean)
    .slice(0, 6);
  return Array.from(new Set(norm));
}

/* ─────────────────────────────────────────────────────────────
   Zod Schemas: entrada y salida
   ───────────────────────────────────────────────────────────── */
const Body = z.object({
  city: z.string().min(2),
  days: z.number().int().min(1).max(5),
  date: z.string(),
  interests: z.array(z.string()).max(6),
  budget: z.enum(['low', 'mid', 'high']).default('mid'),
  pax: z.number().int().min(1).max(20).optional(),
  locale: z.string().max(10).optional(),
  language: z.string().max(5).optional(),
  pace: z.enum(['relax', 'balanced', 'intense']).optional(),
});

const PlanSchema = z.object({
  city: z.string(),
  startDate: z.string(),
  days: z.number().int().min(1),
  budgetTier: z.enum(['low', 'mid', 'high']),
  budgetCOPPerPersonPerDay: z.object({
    min: z.number().int().nonnegative(),
    max: z.number().int().nonnegative(),
  }),
  itinerary: z.array(
    z.object({
      day: z.number().int().min(1),
      date: z.string(),
      title: z.string(),
      summary: z.string(),
      blocks: z.array(
        z.object({
          time: z.string(),
          title: z.string(),
          neighborhood: z.string().optional(),
          description: z.string(),
          approx_cost_cop: z.number().int().nonnegative().optional(),
          booking_hint: z.string().optional(),
        }),
      ),
      safety: z.string(),
      tips: z.string().optional(),
    }),
  ),
  totals: z.object({ approx_total_cop_per_person: z.number().int().nonnegative() }),
  cta: z
    .object({
      message: z.string(),
      tours: z
        .array(z.object({ title: z.string(), url: z.string().url() }))
        .max(3)
        .optional(),
    })
    .optional(),
});

const MarketingSchema = z.object({
  audience: z.object({
    persona: z.string(),
    interestsRanked: z.array(z.string()).max(10),
    tone: z.enum(['amigable', 'premium', 'experto', 'aventurero', 'familiar']).optional(),
  }),
  copy: z.object({
    headline: z.string(),
    subhead: z.string(),
    emailSubject: z.string(),
    emailPreview: z.string(),
    whatsapp: z.string(),
    seoKeywords: z.array(z.string()).max(12),
  }),
  experiments: z
    .array(
      z.object({
        hypothesis: z.string(),
        metric: z.string(),
        variantA: z.string(),
        variantB: z.string(),
      }),
    )
    .max(4)
    .optional(),
  upsells: z
    .array(z.object({ title: z.string(), url: z.string().url() }))
    .max(5)
    .optional(),
});

const OutSchema = z.object({
  plan: PlanSchema,
  marketing: MarketingSchema,
});

/* ─────────────────────────────────────────────────────────────
   Inferencias ligeras
   ───────────────────────────────────────────────────────────── */
function inferPersona(pax?: number, interests: string[] = []) {
  if ((pax ?? 1) >= 4 && interests.includes('ninos')) return 'Familia con niños';
  if ((pax ?? 1) === 2 && (interests.includes('romance') || interests.includes('vino')))
    return 'Pareja exploradora';
  if (interests.includes('gastronomia') || interests.includes('food')) return 'Foodie';
  if (interests.includes('museos') || interests.includes('arte')) return 'Cultural';
  if (interests.includes('senderismo') || interests.includes('naturaleza')) return 'Aventura';
  return (pax ?? 1) > 1 ? 'Amigos en plan urbano' : 'Viajero solo';
}

function defaultTone(
  persona: string,
): 'amigable' | 'premium' | 'experto' | 'aventurero' | 'familiar' {
  if (persona.includes('Familia')) return 'familiar';
  if (persona.includes('Pareja')) return 'premium';
  if (persona.includes('Foodie')) return 'experto';
  if (persona.includes('Aventura')) return 'aventurero';
  return 'amigable';
}

function pickUpsellsFromTours(limit = 3) {
  const base = baseUrl();
  try {
    return TOURS.slice(0, limit).map((t) => ({
      title: t.title,
      url: `${base}/tours/${encodeURIComponent(t.slug)}`,
    }));
  } catch {
    return [] as Array<{ title: string; url: string }>;
  }
}

async function fetchCatalogForPrompt(city: string): Promise<string> {
  const base = baseUrl();
  try {
    const { items } = await listTours({
      ...(city ? { city } : {}),
      limit: 10,
    });
    if (items.length > 0) {
      return items.map((t) => `- ${t.title} [slug: ${t.slug}] → ${base}/tours/${t.slug}`).join('\n');
    }
  } catch {
    // fall through to mock
  }
  return TOURS.slice(0, 8).map((t) => `- ${t.title} [slug: ${t.slug}] → ${base}/tours/${t.slug}`).join('\n');
}

/* ─────────────────────────────────────────────────────────────
   Providers (JSON strict)
   ───────────────────────────────────────────────────────────── */
async function callGeminiJSON(args: { system: string; payloadJSON: object; signal: AbortSignal }) {
  if (!GEMINI_API_KEY) throw new Error('no_gemini_key');

  const url = `${GEMINI_API_URL}/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(
    GEMINI_API_KEY,
  )}`;

  const body = {
    systemInstruction: { parts: [{ text: args.system }] },
    contents: [{ role: 'user', parts: [{ text: JSON.stringify(args.payloadJSON) }] }],
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 1400,
      responseMimeType: 'application/json',
      response_mime_type: 'application/json',
    },
  };

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: args.signal,
  });

  if (!r.ok) throw new Error(`gemini_${r.status}`);
  const data = (await r.json()) as any;

  const raw =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
      .filter(Boolean)
      .join('') ?? '';

  if (!raw) throw new Error('gemini_empty');
  return raw as string;
}

async function callOpenAIJSON(args: { system: string; payloadJSON: object; signal: AbortSignal }) {
  if (!OPENAI_API_KEY) throw new Error('no_openai_key');

  const messages = [
    { role: 'system' as const, content: args.system },
    { role: 'user' as const, content: JSON.stringify(args.payloadJSON) },
  ];

  const attempt = async (useJsonMode: boolean) => {
    const body: Record<string, unknown> = {
      model: OPENAI_MODEL,
      temperature: 0.6,
      messages,
    };
    if (useJsonMode) body.response_format = { type: 'json_object' as const };

    const r = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify(body),
      signal: args.signal,
    });

    if (!r.ok) throw new Error(`openai_${r.status}${useJsonMode ? '_json' : ''}`);
    const data = (await r.json()) as any;
    const raw = data?.choices?.[0]?.message?.content ?? '';
    if (!raw) throw new Error('openai_empty');
    return raw as string;
  };

  try {
    return await attempt(true);
  } catch {
    return await attempt(false);
  }
}

/* ─────────────────────────────────────────────────────────────
   Handler principal
   ───────────────────────────────────────────────────────────── */
function stripFences(raw: string) {
  return raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');
}

export async function POST(req: NextRequest) {
  const requestId =
    globalThis.crypto && 'randomUUID' in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // Anti-abuso: el itinerario consulta IA, así que limitamos.
  const rl = await checkRateLimit(req, {
    action: 'ai.itinerary',
    limit: 20,
    windowSeconds: 60 * 60,
    identity: 'ip+vid',
  });
  if (!rl.allowed) {
    return jsonError(req, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many requests.',
      requestId,
    });
  }

  const clen = contentLengthBytes(req);
  if (clen && clen > 30_000) {
    return jsonError(req, {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Payload too large.',
      requestId,
    });
  }

  const force = normalizeProvider(
    new URL(req.url).searchParams.get('provider') ?? req.headers.get('x-ai-provider'),
  );

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return json(req, { error: 'Invalid body', details: parsed.error.flatten(), requestId }, 400, {
      'X-Request-ID': requestId,
    });
  }

  const input = parsed.data;

  if (
    !isValidISODate(input.date) ||
    !isTodayOrFutureUTC(input.date) ||
    !withinNextMonthsUTC(input.date, 18)
  ) {
    return json(
      req,
      { error: 'Invalid date. Formato YYYY-MM-DD; hoy o futuro; dentro de 18 meses.', requestId },
      400,
      { 'X-Request-ID': requestId },
    );
  }

  const interests = sanitizeInterests(input.interests);
  const persona = inferPersona(input.pax, interests);
  const tone = defaultTone(persona);

  const BUDGET_TABLE: Record<'low' | 'mid' | 'high', { min: number; max: number; label: string }> =
    {
      low: { min: 120_000, max: 220_000, label: 'Bajo' },
      mid: { min: 220_000, max: 420_000, label: 'Medio' },
      high: { min: 420_000, max: 720_000, label: 'Alto' },
    };
  const budgetBand = BUDGET_TABLE[input.budget];

  const lang = (input.language ?? (input.locale?.startsWith('en') ? 'en' : 'es')).toLowerCase();

  // Fetch real catalog (Supabase → mock fallback)
  const catalogLines = await fetchCatalogForPrompt(input.city);

  const system = `
Eres un Travel Planner senior de Knowing Cultures Enterprise (KCE), agencia de turismo cultural premium en Colombia.
Objetivo: generar un itinerario JSON ejecutable + bloque de marketing para CRM, email y SEO.

TOURS KCE DISPONIBLES (usa estos slugs en el itinerario cuando encajen):
${catalogLines}

Reglas duras:
1) No inventes disponibilidad ni precios exactos; usa aproximados en COP y marca "reserva recomendada" cuando aplique.
2) Cada día: 3-5 bloques de 1-3h con hora, barrio, descripción, costo aprox en COP y booking_hint opcional.
3) Incluye campo "safety" por día (consejo de seguridad breve) y "tips" cuando sea útil.
4) Tono: ${tone}. Máximo valor cultural y gastronómico. Lenguaje cercano, no corporativo.
5) Devuelve SOLO JSON válido sin texto extra ni backticks. Schema exacto requerido:
{
  "plan": {
    "city": "string",
    "startDate": "YYYY-MM-DD",
    "days": number,
    "budgetTier": "low|mid|high",
    "budgetCOPPerPersonPerDay": { "min": number, "max": number },
    "itinerary": [
      {
        "day": 1,
        "date": "YYYY-MM-DD",
        "title": "string",
        "summary": "string (1-2 frases)",
        "blocks": [
          {
            "time": "HH:MM",
            "title": "string",
            "neighborhood": "string (opcional)",
            "description": "string",
            "approx_cost_cop": number,
            "booking_hint": "string (opcional)"
          }
        ],
        "safety": "string",
        "tips": "string (opcional)"
      }
    ],
    "totals": { "approx_total_cop_per_person": number },
    "cta": {
      "message": "string",
      "tours": [{ "title": "string", "url": "string" }]
    }
  },
  "marketing": {
    "audience": {
      "persona": "string",
      "interestsRanked": ["string"],
      "tone": "amigable|premium|experto|aventurero|familiar"
    },
    "copy": {
      "headline": "string (max 10 palabras)",
      "subhead": "string (max 20 palabras)",
      "emailSubject": "string",
      "emailPreview": "string",
      "whatsapp": "string (mensaje listo para copiar, max 160 chars)",
      "seoKeywords": ["string"]
    },
    "upsells": [{ "title": "string", "url": "string" }]
  }
}
Idioma de salida: ${lang === 'en' ? 'English' : 'Spanish'}.
`.trim();

  const userPayload = {
    city: input.city,
    days: input.days,
    startDate: input.date,
    interests,
    budget: input.budget,
    budgetBandCOP: budgetBand,
    pax: input.pax ?? 1,
    pace: input.pace ?? 'balanced',
    language: lang,
    persona_hint: persona,
    tone_hint: tone,
  };

  const order: Provider[] = force ? [force] : [AI_PRIMARY, AI_SECONDARY];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const t0 = Date.now();

  let raw = '';
  let chosen: Provider | null = null;

  try {
    for (const prov of order) {
      try {
        raw =
          prov === 'gemini'
            ? await callGeminiJSON({ system, payloadJSON: userPayload, signal: controller.signal })
            : await callOpenAIJSON({ system, payloadJSON: userPayload, signal: controller.signal });

        chosen = prov;
        if (raw) break;
      } catch (e) {
        console.error(`[itinerary] ${prov} failed`, e);
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  if (!raw || !chosen) {
    return json(
      req,
      {
        error: 'AI request failed',
        requestId,
        configured: { gemini: Boolean(GEMINI_API_KEY), openai: Boolean(OPENAI_API_KEY) },
      },
      502,
      {
        'X-Provider': 'none',
        'X-Elapsed-MS': String(Date.now() - t0),
        'X-Request-ID': requestId,
      },
    );
  }

  const cleaned = stripFences(raw);

  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    return json(
      req,
      {
        error: 'Non-JSON response from provider',
        provider: chosen,
        requestId,
        ...(process.env.NODE_ENV !== 'production' ? { raw: cleaned.slice(0, 8000) } : {}),
      },
      502,
      {
        'X-Provider': chosen,
        'X-Elapsed-MS': String(Date.now() - t0),
        'X-Request-ID': requestId,
      },
    );
  }

  const full = OutSchema.safeParse(data);
  if (!full.success) {
    return json(
      req,
      {
        error: 'Schema mismatch',
        provider: chosen,
        requestId,
        details: full.error.flatten(),
        ...(process.env.NODE_ENV !== 'production' ? { raw: cleaned.slice(0, 8000) } : {}),
      },
      502,
      {
        'X-Provider': chosen,
        'X-Elapsed-MS': String(Date.now() - t0),
        'X-Request-ID': requestId,
      },
    );
  }

  if (!full.data.marketing.upsells || full.data.marketing.upsells.length === 0) {
    full.data.marketing.upsells = pickUpsellsFromTours(3);
  }

  return json(
    req,
    {
      ok: true,
      provider: chosen,
      ms: Date.now() - t0,
      requestId,
      plan: full.data.plan,
      marketing: full.data.marketing,
      structured: full.data.plan,
      diagnostics: { persona, tone, budgetBand: budgetBand.label },
    },
    200,
    {
      'X-Provider': chosen,
      'X-Elapsed-MS': String(Date.now() - t0),
      'X-Request-ID': requestId,
    },
  );
}
