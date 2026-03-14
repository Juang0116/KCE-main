import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { jsonError, contentLengthBytes } from '@/lib/apiErrors';
import { absUrl } from '@/lib/env';
import { logEvent } from '@/lib/events.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getSupabasePublic } from '@/lib/supabasePublic';
import { readUtmFromCookies, utmCompactKey } from '@/lib/utm.server';
import { sendPlanResultsEmail } from '@/services/marketingEmail';
import { createOrReuseDeal, createTask } from '@/lib/botStorage.server';
import { enrollLeadInFollowupSequence } from '@/lib/followupAgent.server';
import { notifyOps } from '@/lib/opsNotify.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 25; // Tiempo máximo permitido en Vercel

const BodySchema = z.object({
  language: z.preprocess((v) => (v == null ? undefined : v), z.string().max(12)).optional(),
  city: z.preprocess((v) => (v == null ? undefined : v), z.string().max(80)).optional(),
  budget: z.enum(['low', 'mid', 'high']).optional(),
  interests: z.array(z.string().max(40)).max(12).default([]),
  pace: z.enum(['relaxed', 'balanced', 'intense']).optional(),
  pax: z.preprocess((v) => (v == null ? undefined : v), z.coerce.number().int().min(1).max(20)).optional(),
  travelDates: z.object({ start: z.string().optional(), end: z.string().optional() }).optional(),
  email: z.preprocess((v) => (v == null ? undefined : v), z.string().email()).optional(),
  consent: z.preprocess((v) => (v == null ? undefined : v), z.boolean()).optional(),
  utm: z.preprocess((v) => (v == null ? undefined : v), z.record(z.any())).optional(),
  visitorId: z.preprocess((v) => (v == null ? undefined : v), z.string().max(120)).optional(),
});

function normalizeTag(s: string) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_:\-]/g, '').slice(0, 64);
}

type TourRow = {
  id: string; slug: string; title: string; city: string | null;
  base_price: number | null; rating: number | null; tags: string[] | null; is_featured: boolean | null;
};

function firstCityToken(city?: string | null): string {
  const s = String(city || '').trim();
  if (!s) return '';
  return s.split(',')[0]?.trim() || '';
}

async function fetchFallbackTours(pub: ReturnType<typeof getSupabasePublic>): Promise<TourRow[]> {
  try {
    const { data, error } = await pub.from('tours').select('id,slug,title,city,base_price,rating,tags,is_featured').order('is_featured', { ascending: false }).order('rating', { ascending: false }).limit(12);
    if (error) throw error;
    return (data ?? []) as TourRow[];
  } catch {
    const { data } = await pub.from('tours').select('id,slug,title,city,base_price,rating,tags,is_featured').limit(12);
    return (data ?? []) as TourRow[];
  }
}

type Rec = { title: string; url: string; city?: string | null; slug: string; id: string };

function scoreTour(tour: TourRow, prefs: { interests: string[]; budget?: string; city?: string }) {
  let score = 0;
  const rating = typeof tour.rating === 'number' ? tour.rating : 0;
  score += Math.min(5, Math.max(0, rating)) * 10;
  if (tour.is_featured) score += 12;
  if (prefs.city && typeof tour.city === 'string' && tour.city.toLowerCase() === prefs.city.toLowerCase()) score += 20;
  const tags: string[] = Array.isArray(tour.tags) ? tour.tags : [];
  for (const i of prefs.interests) {
    if (tags.map((t) => String(t).toLowerCase()).includes(i.toLowerCase())) score += 6;
  }
  const price = typeof tour.base_price === 'number' ? tour.base_price : null;
  if (prefs.budget && price != null) {
    if (prefs.budget === 'low' && price <= 5000) score += 6;
    if (prefs.budget === 'mid' && price > 5000 && price <= 15000) score += 6;
    if (prefs.budget === 'high' && price > 15000) score += 6;
  }
  return score;
}

/* ─────────────────────────────────────────────────────────────
   🤖 AI PLANNER AGENT (Structured Outputs)
   ───────────────────────────────────────────────────────────── */
type AiItinerary = {
  title: string;
  summary: string;
  days: {
    day: number;
    theme: string;
    morning: string;
    afternoon: string;
    evening: string;
    recommendedTourSlug?: string;
  }[];
};

/* ─────────────────────────────────────────────────────────────
   AI provider config — Gemini primary, OpenAI fallback
   ───────────────────────────────────────────────────────────── */
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY ?? '').trim();
const GEMINI_MODEL   = (process.env.GEMINI_MODEL   ?? 'gemini-2.0-flash').trim();
const GEMINI_API_URL = (process.env.GEMINI_API_URL  ?? 'https://generativelanguage.googleapis.com').trim();

const OPENAI_API_KEY  = (process.env.OPENAI_API_KEY  ?? '').trim();
const OPENAI_MODEL    = (process.env.OPENAI_MODEL    ?? 'gpt-4o-mini').trim();
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').trim();

type AiProvider = 'gemini' | 'openai';
function resolveProviderOrder(): AiProvider[] {
  const primary   = String(process.env.AI_PRIMARY   ?? 'gemini').trim().toLowerCase();
  const secondary = String(process.env.AI_SECONDARY ?? 'openai').trim().toLowerCase();
  const order: AiProvider[] = [];
  for (const p of [primary, secondary]) {
    if ((p === 'gemini' || p === 'openai') && !order.includes(p as AiProvider)) {
      order.push(p as AiProvider);
    }
  }
  return order.length ? order : ['gemini', 'openai'];
}

function stripFences(raw: string) {
  return raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
}

const ITINERARY_SYSTEM = `
Eres el Lead Travel Designer de KCE (Knowing Cultures Enterprise), agencia de turismo premium en Colombia.
Diseña un itinerario de 3 días en formato JSON estricto. Reglas:
1) Usa aproximados realistas en COP, nunca precios exactos garantizados.
2) Bloques de 2-3h con tiempos y zonas reconocibles. Tono cálido y comercial.
3) Devuelve SOLO JSON válido sin texto adicional ni backticks.
Schema exacto requerido:
{
  "title": "string — título comercial del viaje",
  "summary": "string — párrafo inspiracional máx 3 líneas",
  "days": [
    {
      "day": 1,
      "theme": "string — ej: Exploración Histórica",
      "morning": "string",
      "afternoon": "string",
      "evening": "string",
      "recommendedTourSlug": "string — slug exacto del tour KCE o string vacío"
    }
  ]
}
`.trim();

async function callGeminiItinerary(prompt: string, signal: AbortSignal): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('no_gemini_key');
  const url = `${GEMINI_API_URL}/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const body = {
    systemInstruction: { parts: [{ text: ITINERARY_SYSTEM }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 1200,
      responseMimeType: 'application/json',
    },
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!r.ok) throw new Error(`gemini_${r.status}`);
  const data = await r.json() as any;
  const raw = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('') ?? '';
  if (!raw) throw new Error('gemini_empty');
  return raw;
}

async function callOpenAIItinerary(prompt: string, signal: AbortSignal): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('no_openai_key');
  const r = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.65,
      messages: [
        { role: 'system', content: ITINERARY_SYSTEM },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    }),
    signal,
  });
  if (!r.ok) throw new Error(`openai_${r.status}`);
  const data = await r.json() as any;
  const raw = data?.choices?.[0]?.message?.content ?? '';
  if (!raw) throw new Error('openai_empty');
  return raw;
}

async function generateItineraryWithAI(prefs: any, tours: TourRow[]): Promise<AiItinerary | null> {
  const userPrompt = `
PERFIL DEL VIAJERO:
- Ciudad principal: ${prefs.city || 'Colombia (múltiples destinos)'}
- Intereses: ${(prefs.interests as string[]).join(', ') || 'cultura y descubrimiento'}
- Ritmo: ${prefs.pace || 'balanceado'}
- Presupuesto: ${prefs.budget || 'estándar'}
- Viajeros: ${prefs.pax || 1}

TOURS KCE DISPONIBLES (asigna slugs donde encajen):
${tours.map((t) => `- ${t.title} [slug: ${t.slug}]`).join('\n')}

Genera el itinerario de 3 días.
`.trim();

  const order = resolveProviderOrder();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14_000);

  try {
    for (const prov of order) {
      try {
        const raw =
          prov === 'gemini'
            ? await callGeminiItinerary(userPrompt, controller.signal)
            : await callOpenAIItinerary(userPrompt, controller.signal);
        const cleaned = stripFences(raw);
        const parsed = JSON.parse(cleaned) as AiItinerary;
        if (parsed?.title && Array.isArray(parsed?.days)) return parsed;
      } catch (err) {
        console.error(`[itinerary:${prov}] failed:`, err instanceof Error ? err.message : err);
      }
    }
  } finally {
    clearTimeout(timeout);
  }
  return null;
}

// Helper para convertir el JSON en Markdown legible para el CRM
function formatItineraryForCrm(aiPlan: AiItinerary | null): string {
  if (!aiPlan) return '';
  let md = `\n\n### 🗺️ PLAN GENERADO POR IA: ${aiPlan.title}\n_${aiPlan.summary}_\n\n`;
  aiPlan.days.forEach(d => {
    md += `**Día ${d.day}: ${d.theme}**\n`;
    md += `- 🌅 Mañana: ${d.morning}\n`;
    md += `- ☀️ Tarde: ${d.afternoon}\n`;
    md += `- 🌙 Noche: ${d.evening}\n`;
    if (d.recommendedTourSlug) md += `- 🎯 *Tour KCE Propuesto:* ${d.recommendedTourSlug}\n`;
    md += `\n`;
  });
  return md;
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const clen = contentLengthBytes(req);
  if (clen && clen > 8_000) {
    return jsonError(req, { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Payload too large.', requestId });
  }

  const rl = await checkRateLimit(req, { action: 'quiz.submit', limit: 6, windowSeconds: 3600, identity: 'ip+vid' });
  if (!rl.allowed) {
    void logEvent('api.rate_limited', { request_id: requestId, route: '/api/quiz/submit', action: 'quiz.submit', key_base: rl.keyBase });
    return jsonError(req, { status: 429, code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.', requestId });
  }

  const utmInfo = readUtmFromCookies(req);
  const _utmKey = utmCompactKey(utmInfo);

  try {
    const json = await req.json().catch(() => null);
    const body = BodySchema.parse(json ?? {});

    const pub = getSupabasePublic();
    const cityToken = firstCityToken(body.city);

    const base = pub.from('tours').select('id,slug,title,city,base_price,rating,tags,is_featured').limit(80);

    let tours: TourRow[] = [];
    {
      const q = cityToken ? base.ilike('city', `%${cityToken}%`) : base;
      const { data, error } = await q;
      if (error) throw error;
      tours = (data ?? []) as TourRow[];
    }

    if (tours.length === 0 && cityToken) {
      const { data, error } = await base;
      if (error) throw error;
      tours = (data ?? []) as TourRow[];
    }

    let fallbackUsed = false;
    if (tours.length === 0) {
      tours = await fetchFallbackTours(pub);
      fallbackUsed = true;
    }

    const prefs: { interests: string[]; budget?: string; city?: string; pace?: string; pax?: number } = { 
      interests: body.interests 
    };
    if (body.budget) prefs.budget = body.budget;
    if (body.pace) prefs.pace = body.pace;
    if (body.pax) prefs.pax = body.pax;
    if (cityToken) prefs.city = cityToken;

    const scored = tours
      .map((t) => ({ t, score: scoreTour(t, prefs) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    let chosen = scored.map(({ t }) => t);
    if (chosen.length === 0) {
      chosen = tours.slice(0, 4);
      fallbackUsed = true;
    }

    const recommendations: Rec[] = chosen.map((t) => ({
      id: t.id, slug: t.slug, title: t.title, city: t.city ?? null,
      url: absUrl(`/tours/${encodeURIComponent(t.slug)}`),
    }));

    // 🤖 GENERACIÓN DE IA EN SEGUNDO PLANO
    const aiItinerary = await generateItineraryWithAI(prefs, chosen);

    const crmSummary: {
      leadReady: boolean; leadId: string | null; dealId: string | null; taskId: string | null; followUpWindowHours: number | null;
    } = { leadReady: false, leadId: null, dealId: null, taskId: null, followUpWindowHours: null };

    await logEvent(
      'quiz.completed',
      {
        requestId, city: cityToken || null, budget: body.budget ?? null, interests: body.interests,
        pax: body.pax ?? null, email: body.email ? body.email.toLowerCase() : null,
        recommendations: recommendations.map((r) => r.slug), utm: body.utm ?? utmInfo ?? null, visitorId: body.visitorId ?? null,
      },
      { source: 'api/quiz/submit' },
    );

    if (body.email && body.consent === true) {
      const admin = getSupabaseAdmin();
      if (!admin) {
        return NextResponse.json({ ok: true, requestId, recommendations, itinerary: aiItinerary });
      }

      const email = body.email.toLowerCase();
      const tags = Array.from(
        new Set([
          'quiz', cityToken ? `city:${normalizeTag(cityToken)}` : null, body.budget ? `budget:${body.budget}` : null,
          body.pace ? `pace:${body.pace}` : null, body.pax ? `pax:${String(body.pax)}` : null,
          ...(Array.isArray(body.interests) ? body.interests.map((i) => `i:${normalizeTag(i)}`) : []),
          _utmKey ? `utm:${_utmKey}` : null,
        ].filter(Boolean) as string[]),
      );

      const qLead = await admin.from('leads').select('id').eq('email', email).order('created_at', { ascending: false }).limit(1).maybeSingle();
      const existingLead = qLead?.data ?? null;
      let leadId: string | undefined = existingLead?.id;

      if (!leadId) {
        const createdRes = await admin.from('leads').insert({
          email, source: 'quiz', stage: 'new', tags, language: body.language ?? null, visitor_id: body.visitorId ?? null, utm: body.utm ?? utmInfo ?? null,
        }).select('id').single();

        if (createdRes?.error) throw createdRes.error;
        if (!createdRes?.data?.id) throw new Error('Failed to create lead');
        leadId = createdRes.data.id;
      }

      await admin.from('preferences').upsert({
        owner_type: 'lead', owner_id: leadId, interests: body.interests ?? null,
        budget_range: body.budget ? { tier: body.budget } : null, cities: cityToken ? [cityToken] : [],
        travel_dates: body.travelDates ?? null, pax: body.pax ?? null,
      }, { onConflict: 'owner_type,owner_id' });

      let dealId: string | null = null;
      let taskId: string | null = null;
      try {
        const focusLabel = cityToken || 'Colombia';
        const title = `Plan personalizado · ${focusLabel}`.slice(0, 180);
        
        // 📥 Inyectamos los datos más el Itinerario de IA en las notas del CRM
        const baseNotes = [
          body.pace ? `Ritmo: ${body.pace}` : null, body.budget ? `Budget: ${body.budget}` : null,
          body.pax ? `Viajeros: ${String(body.pax)}` : null, Array.isArray(body.interests) && body.interests.length ? `Intereses: ${body.interests.join(', ')}` : null,
          cityToken ? `Ciudad base: ${cityToken}` : null,
        ].filter(Boolean).join(' | ');

        const finalNotes = baseNotes + formatItineraryForCrm(aiItinerary);

        const routed = await createOrReuseDeal({
          leadId, tourSlug: null, title, stage: 'qualified', source: 'plan_personalizado', notes: finalNotes, requestId,
        });
        dealId = routed.dealId;
        if (dealId) {
          const dueAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
          taskId = await createTask({ dealId, title: 'Revisar Plan de IA y contactar lead en ≤12h', priority: 'high', dueAt, requestId });
          await logEvent('quiz.crm_routed', { requestId, leadId, dealId, taskId, city: cityToken || null }, { source: 'api/quiz/submit' });
          // Auto-enroll in follow-up sequence (best-effort)
          void enrollLeadInFollowupSequence({
            leadId: leadId ?? null,
            dealId,
            city: cityToken || null,
            locale: (body.language || 'es').slice(0, 2),
          }).catch((e) => console.error('[quiz] followup enroll failed:', e?.message));

          // Instant ops notification (best-effort)
          void notifyOps({
            title: '🆕 Nuevo lead — Plan personalizado',
            severity: 'info',
            text: [
              `Email: ${email}`,
              cityToken ? `Ciudad: ${cityToken}` : '',
              body.budget ? `Presupuesto: ${body.budget}` : '',
              Array.isArray(body.interests) && body.interests.length ? `Intereses: ${body.interests.join(', ')}` : '',
              dealId ? `Deal: ${dealId.slice(0, 8)}` : '',
            ].filter(Boolean).join('\n'),
            meta: { leadId: leadId ?? null, dealId, requestId },
          }).catch(() => null);
        }
      } catch {
        // best effort
      }

      crmSummary.leadReady = true; crmSummary.leadId = leadId ?? null; crmSummary.dealId = dealId ?? null;
      crmSummary.taskId = taskId ?? null; crmSummary.followUpWindowHours = 12;

      const emailRecs: { title: string; url: string; city?: string | null }[] = recommendations.map((r) => {
        const city: string | null = typeof r.city === 'string' && r.city.trim() ? r.city : null;
        return city === null ? { title: r.title, url: r.url } : { title: r.title, url: r.url, city };
      });

      await sendPlanResultsEmail({ to: email, name: null, recommendations: emailRecs });

      await logEvent('email.quiz_results_sent', { requestId, email, recommendations: recommendations.map((r) => r.slug) }, { source: 'api/quiz/submit', dedupeKey: `email:quiz:${email}:${recommendations.map((r) => r.slug).join(',')}` });
    }

    return NextResponse.json({
      ok: true,
      requestId,
      recommendations,
      itinerary: aiItinerary, // 📤 Devolvemos el itinerario al frontend por si lo queremos mostrar en pantalla
      message: fallbackUsed ? 'Aquí tienes recomendaciones del catálogo (modo fallback).' : 'Aquí tienes tus recomendaciones.',
      fallbackUsed,
      crm: crmSummary,
    });
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    await logEvent('api.error', { route: 'api/quiz/submit', requestId, message: msg }, { source: 'api/quiz/submit' });
    const isClient = /invalid|required|zod|parse|json/i.test(msg);
    return NextResponse.json({ ok: false, requestId, error: isClient ? 'Bad request' : 'Internal error', errorCode: isClient ? 'INVALID_INPUT' : 'INTERNAL', detail: msg }, { status: isClient ? 400 : 500, headers: { 'X-Request-ID': requestId } });
  }
}