// src/app/api/events/view-tour/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { assertAllowedOriginOrReferer } from '@/lib/requestGuards.server';
import { logEvent } from '@/lib/events.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logSecurityEvent } from '@/lib/securityEvents.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { readUtmFromCookies, utmCompactKey } from '@/lib/utm.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_SLUG = 120;

function pickSlug(input: unknown): string {
  const raw = typeof input === 'string' ? input : '';
  const s = raw.trim().slice(0, MAX_SLUG);
  if (!s || !/^[a-z0-9-]+$/i.test(s)) return '';
  return s;
}

function cookieNameForTour(slug: string) {
  const safe = encodeURIComponent(slug).replace(/%/g, '_').slice(0, 140);
  return `kce_v_${safe}`;
}

async function incrementView(slug: string) {
  const adminRaw = getSupabaseAdmin();
  if (!adminRaw) return;

  // ⛑️ Hotfix: en tu repo los tipos de Database están desalineados y TS infiere never/undefined.
  const admin = adminRaw as any;

  // Preferido: función SQL (update atómico)
  try {
    const rpc = await admin.rpc('increment_tour_view', { p_slug: slug } as any);
    if (!rpc?.error) return;
  } catch {
    // fallback
  }

  // Fallback best-effort (no atómico)
  try {
    const q = await admin
      .from('tours')
      .select('id,view_count')
      .eq('slug', slug)
      .maybeSingle();

    const data = q?.data as { id?: string; view_count?: number } | null | undefined;
    if (!data?.id) return;

    const next = (Number(data.view_count) || 0) + 1;
    await admin.from('tours').update({ view_count: next } as any).eq('id', data.id);
  } catch {
    // ignore
  }
}

export async function POST(req: NextRequest) {
  const originErr = assertAllowedOriginOrReferer(req, { allowInternalHmac: true, allowMissing: false });
  if (originErr) return originErr;

  const requestId = getRequestId(req.headers);

  const rl = await checkRateLimit(req, {
    action: 'events.view_tour',
    limit: 120,
    windowSeconds: 60,
    identity: 'ip+vid',
  });

  if (!rl.allowed) {
    void logSecurityEvent(req, {
      severity: 'warn',
      kind: 'rate_limit',
      meta: { scope: 'events.view_tour', keyBase: rl.keyBase },
    });

    return NextResponse.json(
      { ok: false, requestId, error: 'Too many requests' },
      { status: 429, headers: withRequestId(undefined, requestId) },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const slug = pickSlug(body?.slug ?? body?.tour_slug ?? body?.tour ?? '');

    if (!slug) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Invalid slug' },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const cookieName = cookieNameForTour(slug);
    const already = req.cookies.get(cookieName)?.value === '1';

    if (already) {
      return NextResponse.json(
        { ok: true, requestId, deduped: true },
        { status: 200, headers: withRequestId(undefined, requestId) },
      );
    }

    await incrementView(slug);

    const utm = readUtmFromCookies(req);
    const utm_key = utmCompactKey(utm);

    void logEvent(
      'tour.view',
      {
        request_id: requestId,
        tour_slug: slug,
        vid: utm.vid,
        utm_key,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
      },
      { source: 'api' },
    );

    const res = NextResponse.json(
      { ok: true, requestId, deduped: false },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );

    res.cookies.set(cookieName, '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    void logEvent(
      'api.error',
      {
        request_id: requestId,
        route: '/api/events/view-tour',
        error: message,
      },
      { source: 'api' },
    );

    return NextResponse.json(
      { ok: false, requestId, error: 'Failed to record tour view' },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}

export async function GET(req: NextRequest) {
  const originErr = assertAllowedOriginOrReferer(req, { allowInternalHmac: true, allowMissing: false });
  if (originErr) return originErr;

  const requestId = getRequestId(req.headers);

  const rl = await checkRateLimit(req, {
    action: 'events.view_tour',
    limit: 120,
    windowSeconds: 60,
    identity: 'ip+vid',
  });

  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Too many requests' },
      { status: 429, headers: withRequestId(undefined, requestId) },
    );
  }

  const { searchParams } = new URL(req.url);
  const slug = pickSlug(searchParams.get('slug'));

  if (!slug) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Invalid slug' },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  await incrementView(slug);

  const utm = readUtmFromCookies(req);
  const utm_key = utmCompactKey(utm);

  void logEvent(
    'tour.view',
    {
      request_id: requestId,
      tour_slug: slug,
      via: 'GET',
      vid: utm.vid,
      utm_key,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
    },
    { source: 'api' },
  );

  return NextResponse.json(
    { ok: true, requestId, deduped: false },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
