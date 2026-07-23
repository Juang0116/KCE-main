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

  // 1. Validación de tamaño de carga
  const clen = contentLengthBytes(req);
  if (clen && clen > 2_000) {
    return jsonError(req, {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Carga demasiado pesada.',
      requestId,
    });
  }

  // 2. Rate limit para evitar spam de clics en el corazón
  const rl = await checkRateLimit(req, {
    action: 'wishlist.toggle',
    limit: 20,
    windowSeconds: 300,
    identity: 'vid',
  });

  if (!rl.allowed) {
    void logEvent('api.rate_limited', { request_id: requestId, route: '/api/wishlist/toggle' });
    return jsonError(req, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Demasiadas solicitudes. Intenta más tarde.',
      requestId,
    });
  }

  const admin = getSupabaseAdmin();
  const utmInfo = readUtmFromCookies(req);
  const utmKey = utmCompactKey(utmInfo);
  const bucketTime = Math.floor(Date.now() / 1000 / 3600);

  try {
    // 3. Autenticación robusta
    const token = bearerToken(req);
    if (!token) {
      return jsonError(req, {
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'No autorizado',
        requestId,
      });
    }

    const { data: userRes, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return jsonError(req, {
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Sesión inválida',
        requestId,
      });
    }

    const user = userRes.user;
    const userId = user.id;

    // Solo usuarios verificados pueden persistir wishlist (regla de negocio KCE)
    if (!isEmailVerified(user)) {
      return jsonError(req, {
        status: 403,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email no verificado.',
        requestId,
      });
    }

    const bodyJson = await req.json().catch(() => null);
    const body = BodySchema.parse(bodyJson ?? {});

    let tourId = body.tourId ?? null;

    // Si mandan slug, buscamos el ID
    if (!tourId && body.tourSlug) {
      const { data: t } = await admin
        .from('tours')
        .select('id')
        .eq('slug', body.tourSlug)
        .maybeSingle();
      tourId = t?.id ?? null;
    }

    if (!tourId) {
      return jsonError(req, {
        status: 400,
        code: 'INVALID_INPUT',
        message: 'Tour no identificado',
        requestId,
      });
    }

    // 4. Asegurar existencia de Wishlist vinculada al usuario
    const { data: wl, error: wlErr } = await admin
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (wlErr) throw wlErr;

    let wishlistId = wl?.id;

    if (!wishlistId) {
      const { data: created, error: cErr } = await admin
        .from('wishlists')
        .insert({ user_id: userId })
        .select('id')
        .single();
      if (cErr) throw cErr;
      wishlistId = created.id;
    }

    // 5. Lógica de Toggle (Quitar si existe, añadir si no)
    const { data: existingItem } = await admin
      .from('wishlist_items')
      .select('id')
      .eq('wishlist_id', wishlistId)
      .eq('tour_id', tourId)
      .maybeSingle();

    if (existingItem?.id) {
      // REMOVER
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
          utm_key: utmKey,
        },
        { source: 'api/wishlist/toggle', entityId: tourId },
      );

      return NextResponse.json({ ok: true, action: 'removed', requestId });
    } else {
      // AÑADIR
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
          utm_key: utmKey,
        },
        { source: 'api/wishlist/toggle', entityId: tourId },
      );

      return NextResponse.json({ ok: true, action: 'added', requestId });
    }
  } catch (err: any) {
    await logEvent('api.error', {
      route: 'api/wishlist/toggle',
      message: err.message,
    });
    return jsonError(req, {
      status: 500,
      code: 'INTERNAL',
      message: 'Error interno del servidor',
      requestId,
    });
  }
}
