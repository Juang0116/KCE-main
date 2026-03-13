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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_:\-]/g, '')
    .slice(0, 64);
}

type TourRow = {
  id: string;
  slug: string;
  title: string;
  city: string | null;
  base_price: number | null;
  rating: number | null;
  tags: string[] | null;
  is_featured: boolean | null;
};

function firstCityToken(city?: string | null): string {
  const s = String(city || '').trim();
  if (!s) return '';
  return s.split(',')[0]?.trim() || '';
}

async function fetchFallbackTours(pub: ReturnType<typeof getSupabasePublic>): Promise<TourRow[]> {
  try {
    const { data, error } = await pub
      .from('tours')
      .select('id,slug,title,city,base_price,rating,tags,is_featured')
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false })
      .limit(12);
    if (error) throw error;
    return (data ?? []) as TourRow[];
  } catch {
    const { data } = await pub
      .from('tours')
      .select('id,slug,title,city,base_price,rating,tags,is_featured')
      .limit(12);
    return (data ?? []) as TourRow[];
  }
}

type Rec = { title: string; url: string; city?: string | null; slug: string; id: string };

function scoreTour(tour: TourRow, prefs: { interests: string[]; budget?: string; city?: string }) {
  let score = 0;

  const rating = typeof tour.rating === 'number' ? tour.rating : 0;
  score += Math.min(5, Math.max(0, rating)) * 10;

  if (tour.is_featured) score += 12;

  if (prefs.city && typeof tour.city === 'string' && tour.city.toLowerCase() === prefs.city.toLowerCase()) {
    score += 20;
  }

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

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const clen = contentLengthBytes(req);
  if (clen && clen > 8_000) {
    return jsonError(req, {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Payload too large.',
      requestId,
    });
  }

  const rl = await checkRateLimit(req, {
    action: 'quiz.submit',
    limit: 6,
    windowSeconds: 3600,
    identity: 'ip+vid',
  });
  if (!rl.allowed) {
    void logEvent('api.rate_limited', {
      request_id: requestId,
      route: '/api/quiz/submit',
      action: 'quiz.submit',
      key_base: rl.keyBase,
    });
    return jsonError(req, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
      requestId,
    });
  }

  const utmInfo = readUtmFromCookies(req);
  const _utmKey = utmCompactKey(utmInfo);

  try {
    const json = await req.json().catch(() => null);
    const body = BodySchema.parse(json ?? {});

    const pub = getSupabasePublic();
    const cityToken = firstCityToken(body.city);

    const base = pub
      .from('tours')
      .select('id,slug,title,city,base_price,rating,tags,is_featured')
      .limit(80);

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

    const prefs: { interests: string[]; budget?: string; city?: string } = { interests: body.interests };
    if (body.budget) prefs.budget = body.budget;
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
      id: t.id,
      slug: t.slug,
      title: t.title,
      city: t.city ?? null,
      url: absUrl(`/tours/${encodeURIComponent(t.slug)}`),
    }));

    const crmSummary: {
      leadReady: boolean;
      leadId: string | null;
      dealId: string | null;
      taskId: string | null;
      followUpWindowHours: number | null;
    } = {
      leadReady: false,
      leadId: null,
      dealId: null,
      taskId: null,
      followUpWindowHours: null,
    };

    await logEvent(
      'quiz.completed',
      {
        requestId,
        city: cityToken || null,
        budget: body.budget ?? null,
        interests: body.interests,
        pax: body.pax ?? null,
        email: body.email ? body.email.toLowerCase() : null,
        recommendations: recommendations.map((r) => r.slug),
        utm: body.utm ?? utmInfo ?? null,
        visitorId: body.visitorId ?? null,
      },
      { source: 'api/quiz/submit' },
    );

    if (body.email && body.consent === true) {
      const admin = getSupabaseAdmin();
      if (!admin) {
        return NextResponse.json({ ok: true, requestId, recommendations });
      }

      const email = body.email.toLowerCase();

      const tags = Array.from(
        new Set(
          [
            'quiz',
            cityToken ? `city:${normalizeTag(cityToken)}` : null,
            body.budget ? `budget:${body.budget}` : null,
            body.pace ? `pace:${body.pace}` : null,
            body.pax ? `pax:${String(body.pax)}` : null,
            ...(Array.isArray(body.interests) ? body.interests.map((i) => `i:${normalizeTag(i)}`) : []),
            _utmKey ? `utm:${_utmKey}` : null,
          ].filter(Boolean) as string[],
        ),
      );

      const qLead = await admin
        .from('leads')
        .select('id')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const existingLead = qLead?.data ?? null;
      let leadId: string | undefined = existingLead?.id;

      // ✅ Eliminado el casteo `as any` gracias a los nuevos tipos
      if (!leadId) {
        const createdRes = await admin
          .from('leads')
          .insert({
            email,
            source: 'quiz',
            stage: 'new',
            tags,
            language: body.language ?? null,
            visitor_id: body.visitorId ?? null,
            utm: body.utm ?? utmInfo ?? null,
          })
          .select('id')
          .single();

        if (createdRes?.error) throw createdRes.error;
        if (!createdRes?.data?.id) throw new Error('Failed to create lead');

        leadId = createdRes.data.id;
      }

      await admin
        .from('preferences')
        .upsert(
          {
            owner_type: 'lead',
            owner_id: leadId,
            interests: body.interests ?? null,
            budget_range: body.budget ? { tier: body.budget } : null,
            cities: cityToken ? [cityToken] : [],
            travel_dates: body.travelDates ?? null,
            pax: body.pax ?? null,
          },
          { onConflict: 'owner_type,owner_id' },
        );

      let dealId: string | null = null;
      let taskId: string | null = null;
      try {
        const focusLabel = cityToken || 'Colombia';
        const title = `Plan personalizado · ${focusLabel}`.slice(0, 180);
        const routed = await createOrReuseDeal({
          leadId,
          tourSlug: null,
          title,
          stage: 'qualified',
          source: 'plan_personalizado',
          notes: [
            body.pace ? `Ritmo: ${body.pace}` : null,
            body.budget ? `Budget: ${body.budget}` : null,
            body.pax ? `Viajeros: ${String(body.pax)}` : null,
            Array.isArray(body.interests) && body.interests.length ? `Intereses: ${body.interests.join(', ')}` : null,
            cityToken ? `Ciudad base: ${cityToken}` : null,
          ].filter(Boolean).join(' | '),
          requestId,
        });
        dealId = routed.dealId;
        if (dealId) {
          const dueAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
          taskId = await createTask({
            dealId,
            title: 'Revisar plan personalizado y contactar lead en ≤12h',
            priority: 'high',
            dueAt,
            requestId,
          });
          await logEvent(
            'quiz.crm_routed',
            { requestId, leadId, dealId, taskId, city: cityToken || null },
            { source: 'api/quiz/submit' },
          );
        }
      } catch {
        // best effort
      }

      crmSummary.leadReady = true;
      crmSummary.leadId = leadId ?? null;
      crmSummary.dealId = dealId ?? null;
      crmSummary.taskId = taskId ?? null;
      crmSummary.followUpWindowHours = 12;

      const emailRecs: { title: string; url: string; city?: string | null }[] = recommendations.map((r) => {
        const city: string | null = typeof r.city === 'string' && r.city.trim() ? r.city : null;
        return city === null ? { title: r.title, url: r.url } : { title: r.title, url: r.url, city };
      });

      await sendPlanResultsEmail({
        to: email,
        name: null,
        recommendations: emailRecs,
      });

      await logEvent(
        'email.quiz_results_sent',
        { requestId, email, recommendations: recommendations.map((r) => r.slug) },
        {
          source: 'api/quiz/submit',
          dedupeKey: `email:quiz:${email}:${recommendations.map((r) => r.slug).join(',')}`,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      requestId,
      recommendations,
      message: fallbackUsed
        ? 'Aquí tienes recomendaciones del catálogo (modo fallback).'
        : 'Aquí tienes tus recomendaciones.',
      fallbackUsed,
      crm: crmSummary,
    });
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    await logEvent(
      'api.error',
      { route: 'api/quiz/submit', requestId, message: msg },
      { source: 'api/quiz/submit' },
    );

    const isClient = /invalid|required|zod|parse|json/i.test(msg);
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: isClient ? 'Bad request' : 'Internal error',
        errorCode: isClient ? 'INVALID_INPUT' : 'INTERNAL',
        detail: msg,
      },
      { status: isClient ? 400 : 500, headers: { 'X-Request-ID': requestId } },
    );
  }
}