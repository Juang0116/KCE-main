// src/app/api/reviews/route.ts
import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { jsonError, contentLengthBytes } from '@/lib/apiErrors';
import { corsHeaders, corsPreflight } from '@/lib/cors';
import { logEvent } from '@/lib/events.server';
import { getClientIp } from '@/lib/net';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { sanitizeTitle } from '@/lib/sanitize';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getSupabasePublic, isSupabasePublicConfigured } from '@/lib/supabasePublic';
import type { Database } from '@/types/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];

/* ───────── Schema ───────── */
const ReviewCreateSchema = z.object({
  tour_slug: z.string().min(1).max(120),
  tour_id: z.string().uuid().optional().nullable(),

  rating: z.number().int().min(1).max(5),

  title: z.string().trim().max(80).optional().nullable(),
  body: z.string().trim().min(10).max(1200).optional().nullable(),

  // compat legacy
  comment: z.string().trim().min(10).max(1200).optional().nullable(),

  customer_name: z.string().trim().min(2).max(80).optional().nullable(),
  customer_email: z.string().trim().email().max(255).optional().nullable(),

  avatar_url: z.string().url().max(1024).optional().nullable(),

  // galería (puede NO existir en types)
  media_urls: z.array(z.string().url().max(1024)).max(4).optional().nullable(),
  face_consent: z.boolean().optional().nullable(),

  honeypot: z.string().optional().nullable(),
});

const ReviewsListQuerySchema = z.object({
  tour: z.string().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  page: z.coerce.number().int().min(1).max(200).default(1),
});

/* ───────── Helpers ───────── */
function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

/**
 * Cliente authed (anon + JWT) SOLO para getUser (telemetría).
 * NO se usa para insertar.
 */
function makeAuthedSupabaseClient(jwt: string) {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anon) return null;

  return createClient<Database>(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const clen = contentLengthBytes(req);
  if (clen && clen > 12_000) {
    return jsonError(req, {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Payload too large.',
      requestId,
    });
  }

  if (!isSupabasePublicConfigured()) {
    return NextResponse.json(
      { error: 'Supabase public not configured', requestId },
      { status: 503, headers: { ...corsHeaders(req), ...withRequestId(undefined, requestId) } },
    );
  }

  const url = new URL(req.url);
  const parsed = ReviewsListQuerySchema.safeParse({
    tour: url.searchParams.get('tour'),
    limit: url.searchParams.get('limit'),
    page: url.searchParams.get('page'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid query',
        errorCode: 'INVALID_INPUT',
        details: parsed.error.flatten(),
        requestId,
      },
      { status: 400, headers: { ...corsHeaders(req), ...withRequestId(undefined, requestId) } },
    );
  }

  const { tour, limit, page } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = getSupabasePublic();

  const q = supabase
    .from('reviews')
    .select(
      // Si tu DB tiene media_urls/face_consent, esto funciona aunque types estén viejos
      'id,tour_slug,tour_id,rating,title,body,comment,customer_name,avatar_url,media_urls,face_consent,status,published_at,created_at',
      { count: 'exact' },
    )
    .eq('tour_slug', tour)
    .or('status.eq.approved,approved.eq.true')
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data, error, count } = await q;

  if (error) {
    void logEvent('api.error', {
      request_id: requestId,
      route: '/api/reviews',
      error: error.message,
    });
    return NextResponse.json(
      { error: error.message, requestId },
      { status: 500, headers: { ...corsHeaders(req), ...withRequestId(undefined, requestId) } },
    );
  }

  return NextResponse.json(
    { items: data ?? [], page, limit, total: count ?? null, requestId },
    { headers: { ...corsHeaders(req), ...withRequestId(undefined, requestId) } },
  );
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const clen = contentLengthBytes(req);
  if (clen && clen > 12_000) {
    return jsonError(req, {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Payload too large.',
      requestId,
    });
  }

  if (!isSupabasePublicConfigured()) {
    return NextResponse.json(
      { error: 'Supabase public not configured', requestId },
      { status: 503, headers: { ...corsHeaders(req), ...withRequestId(undefined, requestId) } },
    );
  }

  try {
    const rl = await checkRateLimit(req, {
      action: 'reviews.create',
      limit: 3,
      windowSeconds: 3600,
      identity: 'ip+vid',
    });
    if (!rl.allowed) {
      void logEvent('api.rate_limited', {
        request_id: requestId,
        route: '/api/reviews',
        action: 'reviews.create',
        key_base: rl.keyBase,
      });
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', requestId },
        { status: 429, headers: { ...corsHeaders(req), ...withRequestId(undefined, requestId) } },
      );
    }

    const payload = await req.json();
    const parsed = ReviewCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid body',
          errorCode: 'INVALID_INPUT',
          details: parsed.error.flatten(),
          requestId,
        },
        { status: 400, headers: { ...corsHeaders(req), ...withRequestId(undefined, requestId) } },
      );
    }

    const v = parsed.data;

    // honeypot → bots
    if ((v.honeypot ?? '').trim()) {
      return NextResponse.json(
        { ok: true, requestId },
        { headers: { ...corsHeaders(req), ...withRequestId(undefined, requestId) } },
      );
    }

    const body = String(v.body ?? v.comment ?? '').trim();
    if (!body) {
      return NextResponse.json(
        { error: 'Missing body', errorCode: 'INVALID_INPUT', requestId },
        { status: 400, headers: { ...corsHeaders(req), ...withRequestId(undefined, requestId) } },
      );
    }

    const media_urls = Array.isArray(v.media_urls) ? v.media_urls.filter(Boolean).slice(0, 4) : [];
    const face_consent = Boolean(v.face_consent);
    if (media_urls.length > 0 && !face_consent) {
      return NextResponse.json(
        {
          error: 'Consent required to publish photos (face_consent).',
          errorCode: 'CONSENT_REQUIRED',
          requestId,
        },
        { status: 400, headers: { ...corsHeaders(req), ...withRequestId(undefined, requestId) } },
      );
    }

    const ip = getClientIp(req.headers);

    // JWT opcional (telemetría)
    const jwt = getBearerToken(req);
    let authedUserId: string | null = null;
    if (jwt) {
      const authed = makeAuthedSupabaseClient(jwt);
      if (authed) {
        const u = await authed.auth.getUser().catch(() => null);
        authedUserId = u?.data?.user?.id ?? null;
      }
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Supabase admin not configured (cannot create review safely).', requestId },
        { status: 503, headers: { ...corsHeaders(req), ...withRequestId(undefined, requestId) } },
      );
    }

    // Rate-limit extra (best-effort) por IP via events
    if (ip) {
      const since = new Date(Date.now() - 60_000).toISOString();
      const rl2 = await admin
        .from('events')
        .select('id')
        .eq('type', 'review_submitted')
        .gte('created_at', since)
        .contains('payload', { ip })
        .limit(3);

      if (!rl2.error && (rl2.data?.length ?? 0) >= 3) {
        return NextResponse.json(
          { error: 'Rate limit exceeded', requestId },
          { status: 429, headers: { ...corsHeaders(req), ...withRequestId(undefined, requestId) } },
        );
      }
    }

    // Base payload ESTRICTAMENTE tipado (solo columnas que TS conoce)
    const basePayload: ReviewInsert = {
      tour_slug: v.tour_slug,
      tour_id: v.tour_id ?? null,

      rating: v.rating,

      title: v.title ? sanitizeTitle(v.title, 80) : null,
      body,

      customer_name: v.customer_name ?? null,
      customer_email: v.customer_email ?? null,

      avatar_url: v.avatar_url ?? null,

      status: 'pending',
      published_at: null,
      verified_booking_id: null,

      // legacy compat
      comment: body,
      approved: false,
    };

    /**
     * EXTENSIÓN dinámica:
     * Si tu DB tiene media_urls/face_consent pero tus types están viejos,
     * esto permite insertarlos SIN romper TS.
     */
    const insertPayload: any = { ...basePayload };
    if (media_urls.length > 0) insertPayload.media_urls = media_urls;
    // Guarda el consentimiento sólo cuando tiene sentido
    if (media_urls.length > 0) insertPayload.face_consent = face_consent;

    const ins = await admin.from('reviews').insert(insertPayload).select('id').single();
    if (ins.error) throw new Error(ins.error.message);

    void logEvent('review_submitted', {
      request_id: requestId,
      review_id: ins.data.id,
      tour_slug: v.tour_slug,
      rating: v.rating,
      ip,
      has_avatar: Boolean(v.avatar_url),
      has_media: media_urls.length > 0,
      authed_user_id: authedUserId,
    });

    return NextResponse.json(
      { ok: true, id: ins.data.id, requestId },
      { headers: { ...corsHeaders(req), ...withRequestId(undefined, requestId) } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    void logEvent('api.error', { request_id: requestId, route: '/api/reviews', error: message });

    return NextResponse.json(
      { error: message, requestId },
      { status: 500, headers: { ...corsHeaders(req), ...withRequestId(undefined, requestId) } },
    );
  }
}
