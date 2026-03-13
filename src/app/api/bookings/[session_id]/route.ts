// src/app/api/bookings/[session_id]/route.ts
import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';

import { serverEnv, isProd, SITE_URL } from '@/lib/env';
import { verifyLinkToken } from '@/lib/linkTokens.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ session_id: string }> };

const BASE_URL = (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

function json(data: unknown, status = 200, requestId?: string) {
  const ok = status >= 200 && status < 300;

  return new NextResponse(JSON.stringify({ ok, ...((data as any) ?? {}), requestId }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...(requestId ? withRequestId(undefined, requestId) : {}),
    },
  });
}

/**
 * ✅ Fallback seguro para móvil:
 * si no llega ?t=..., intenta leerlo del Referer (solo mismo origen y booking/<id>)
 */
function tokenFromReferer(req: NextRequest, sessionId: string): string {
  const ref = (req.headers.get('referer') || '').trim();
  if (!ref) return '';

  try {
    const u = new URL(ref);
    const base = new URL(BASE_URL);

    // mismo origen
    if (u.origin !== base.origin) return '';

    // debe venir de /booking/<sessionId> (con o sin locale)
    const p = u.pathname || '';
    if (
      !p.includes(`/booking/${encodeURIComponent(sessionId)}`) &&
      !p.includes(`/booking/${sessionId}`)
    )
      return '';

    return (u.searchParams.get('t') || '').trim();
  } catch {
    return '';
  }
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const requestId = getRequestId(req.headers);

  const admin = getSupabaseAdmin();
  if (!admin) return json({ error: 'Supabase admin not configured' }, 503, requestId);

  const { session_id } = await ctx.params;
  const sessionId = String(session_id || '').trim();
  if (!sessionId) return json({ error: 'Missing session_id' }, 400, requestId);

  // Security: require signed token for public access in production.
  const internalKey = (req.headers.get('x-internal-key') || '').trim();
  const internalOk = !!(
    serverEnv.INTERNAL_API_KEY &&
    internalKey &&
    internalKey === serverEnv.INTERNAL_API_KEY
  );

  const secret = (serverEnv.LINK_TOKEN_SECRET || '').trim();

  // ✅ token por query o por referer (fallback)
  const tokenQuery = (req.nextUrl.searchParams.get('t') || '').trim();
  const token = tokenQuery || tokenFromReferer(req, sessionId);

  if (isProd && !internalOk) {
    if (!secret) return json({ error: 'LINK_TOKEN_SECRET not set' }, 500, requestId);

    const v = verifyLinkToken({ token, secret, expectedSessionId: sessionId });
    if (!v.ok) return json({ error: 'Forbidden', reason: v.reason }, 403, requestId);
  }

  const { data, error } = await admin
    .from('bookings')
    .select(
      'id,status,date,persons,total,currency,origin_currency,tour_price_minor,payment_provider,stripe_session_id,customer_email,customer_name,phone,created_at,updated_at,extras,tour:tour_id(id,slug,title,summary,city,images)',
    )
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500, requestId);
  if (!data) return json({ error: 'Booking not found' }, 404, requestId);

  return json({ booking: data }, 200, requestId);
}
