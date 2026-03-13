// src/app/api/wishlist/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { jsonError } from '@/lib/apiErrors';
import { isEmailVerified } from '@/lib/auth/verification';
import { logEvent } from '@/lib/events.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { readUtmFromCookies, utmCompactKey } from '@/lib/utm.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  // Rate limit: prevent abuse (read)
  const RL_LIMIT = 1200;
  const RL_WINDOW_SECONDS = 300;

  const rl = await checkRateLimit(req, {
    action: 'wishlist.get',
    // Account widgets + the wishlist page can trigger multiple reads.
    // We keep a generous limit while still protecting against abuse.
    limit: RL_LIMIT,
    windowSeconds: RL_WINDOW_SECONDS,
    identity: 'ip+vid',
  });

  if (!rl.allowed) {
    void logEvent('api.rate_limited', {
      request_id: requestId,
      route: '/api/wishlist',
      action: 'wishlist.get',
      key_base: rl.keyBase,
    });

    return jsonError(req, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many requests. Try later.',
      requestId,
      headers: {
        'Retry-After': String(rl.retryAfterSeconds ?? 30),
        'X-RateLimit-Limit': String(RL_LIMIT),
        'X-RateLimit-Remaining': String(rl.remaining ?? 0),
      },
    });
  }

  try {
    const token = bearerToken(req);
    if (!token) {
      return jsonError(req, {
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        requestId,
      });
    }

    const admin = getSupabaseAdmin();

    const { data: userRes, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return jsonError(req, {
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        requestId,
      });
    }

    const userId = userRes.user.id;
    if (!isEmailVerified(userRes.user)) {
      return jsonError(req, {
        status: 403,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email not verified.',
        requestId,
        extra: { email: userRes.user.email ?? null },
      });
    }

    const utmInfo = readUtmFromCookies(req);
    const utmKey = utmCompactKey(utmInfo);

    // Find wishlist id
    const { data: wl, error: wlErr } = await admin
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (wlErr) throw wlErr;

    if (!wl?.id) {
      return NextResponse.json({ ok: true, items: [], requestId });
    }

    /**
     * NOTE:
     * We intentionally avoid PostgREST embedded joins here.
     * Some user DB setups can miss FK metadata (or have it in a different schema),
     * which makes `.select('tours (...)')` fail even though the rows exist.
     *
     * Two-step fetch is more robust and removes recurring 500s.
     */
    const { data: itemRows, error: itemsErr } = await admin
      .from('wishlist_items')
      .select('id, created_at, tour_id')
      .eq('wishlist_id', wl.id)
      .order('created_at', { ascending: false });

    if (itemsErr) throw itemsErr;

    const tourIds = (itemRows ?? []).map((r: any) => r.tour_id).filter(Boolean);
    if (!tourIds.length) {
      return NextResponse.json({ ok: true, items: [], requestId });
    }

    const { data: tours, error: toursErr } = await admin
      .from('tours')
      .select('id, slug, title, city, base_price, images')
      .in('id', tourIds);

    if (toursErr) throw toursErr;

    const byId = new Map<string, any>();
    for (const t of tours ?? []) byId.set((t as any).id, t);

    const rows = (itemRows ?? []).map((r: any) => ({
      id: r.id,
      created_at: r.created_at,
      tours: byId.get(r.tour_id) ?? null,
    }));

    void logEvent(
      'wishlist.viewed',
      {
        requestId,
        userId,
        count: Array.isArray(rows) ? rows.length : 0,
        vid: utmInfo.vid,
        utm_key: utmKey,
        utm_source: utmInfo.utm_source,
        utm_medium: utmInfo.utm_medium,
        utm_campaign: utmInfo.utm_campaign,
      },
      { source: 'api/wishlist' },
    );

    return NextResponse.json({ ok: true, items: rows ?? [], requestId });
  } catch (err: any) {
    await logEvent(
      'api.error',
      { route: 'api/wishlist', requestId, message: String(err?.message ?? err) },
      { source: 'api/wishlist' },
    );
    return jsonError(req, { status: 500, code: 'INTERNAL', message: 'Internal error', requestId });
  }
}
