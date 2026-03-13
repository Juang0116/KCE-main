// src/app/api/wishlist/toggle/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { jsonError, contentLengthBytes } from '@/lib/apiErrors';
import { isEmailVerified } from '@/lib/auth/verification';
import { logEvent } from '@/lib/events.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { readUtmFromCookies, utmCompactKey } from '@/lib/utm.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  tourId: z.string().uuid().optional(),
  tourSlug: z.string().min(1).max(120).optional(),
});

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const clen = contentLengthBytes(req);
  if (clen && clen > 2_000) {
    return jsonError(req, {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Payload too large.',
      requestId,
    });
  }

  // Rate limit: prevent spam toggling
  const rl = await checkRateLimit(req, {
    action: 'wishlist.toggle',
    limit: 20,
    windowSeconds: 300,
    identity: 'vid',
  });
  if (!rl.allowed) {
    void logEvent('api.rate_limited', {
      request_id: requestId,
      route: '/api/wishlist/toggle',
      action: 'wishlist.toggle',
      key_base: rl.keyBase,
    });
    return jsonError(req, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many requests. Try later.',
      requestId,
    });
  }

  const admin = getSupabaseAdmin();
  const utmInfo = readUtmFromCookies(req);
  const utmKey = utmCompactKey(utmInfo);
  const bucket = Math.floor(Date.now() / 1000 / 3600); // bucket por hora

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

    const json = await req.json().catch(() => null);
    const body = BodySchema.parse(json ?? {});

    let tourId = body.tourId ?? null;

    if (!tourId && body.tourSlug) {
      const { data: t, error: tErr } = await admin
        .from('tours')
        .select('id')
        .eq('slug', body.tourSlug)
        .maybeSingle();
      if (tErr) throw tErr;
      tourId = t?.id ?? null;
    }

    if (!tourId) {
      return jsonError(req, {
        status: 400,
        code: 'INVALID_INPUT',
        message: 'Missing tourId/tourSlug',
        requestId,
      });
    }

    // Ensure wishlist exists (1 por usuario)
    const { data: wl, error: wlErr } = await admin
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (wlErr) throw wlErr;

    let wishlistId = wl?.id ?? null;

    if (!wishlistId) {
      const { data: created, error: cErr } = await admin
        .from('wishlists')
        .insert({ user_id: userId })
        .select('id')
        .single();
      if (cErr) throw cErr;
      wishlistId = created.id;
    }

    // Toggle item
    const { data: existingItem, error: exErr } = await admin
      .from('wishlist_items')
      .select('id')
      .eq('wishlist_id', wishlistId)
      .eq('tour_id', tourId)
      .maybeSingle();

    if (exErr) throw exErr;

    if (existingItem?.id) {
      const { error: delErr } = await admin
        .from('wishlist_items')
        .delete()
        .eq('id', existingItem.id);
      if (delErr) throw delErr;

      await logEvent(
        'wishlist.removed',
        {
          requestId,
          userId,
          tourId,
          vid: utmInfo.vid,
          utm_key: utmKey,
          utm_source: utmInfo.utm_source,
          utm_medium: utmInfo.utm_medium,
          utm_campaign: utmInfo.utm_campaign,
        },
        {
          source: 'api/wishlist/toggle',
          entityId: tourId,
          dedupeKey: `wishlist:remove:${userId}:${tourId}:${bucket}`,
        },
      );

      return NextResponse.json({ ok: true, action: 'removed', requestId });
    }

    const { error: insErr } = await admin
      .from('wishlist_items')
      .insert({ wishlist_id: wishlistId, tour_id: tourId });

    if (insErr) throw insErr;

    await logEvent(
      'wishlist.added',
      {
        requestId,
        userId,
        tourId,
        vid: utmInfo.vid,
        utm_key: utmKey,
        utm_source: utmInfo.utm_source,
        utm_medium: utmInfo.utm_medium,
        utm_campaign: utmInfo.utm_campaign,
      },
      {
        source: 'api/wishlist/toggle',
        entityId: tourId,
        dedupeKey: `wishlist:add:${userId}:${tourId}:${bucket}`,
      },
    );

    return NextResponse.json({ ok: true, action: 'added', requestId });
  } catch (err: any) {
    await logEvent(
      'api.error',
      { route: 'api/wishlist/toggle', requestId, message: String(err?.message ?? err) },
      { source: 'api/wishlist/toggle' },
    );
    return jsonError(req, { status: 500, code: 'INTERNAL', message: 'Internal error', requestId });
  }
}
