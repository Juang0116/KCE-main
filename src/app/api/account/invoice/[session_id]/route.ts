import { NextResponse, type NextRequest } from 'next/server';

import { serverEnv } from '@/lib/env';
import { json } from '@/lib/http.server';
import { signLinkToken } from '@/lib/linkTokens.server';
import { getRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ session_id: string }> };

type BookingRow = {
  id: string;
  user_id: string | null;
  customer_email: string | null;
  stripe_session_id: string | null;
};

async function resolveUser(req: NextRequest) {
  const admin = getSupabaseAdmin();
  const auth = req.headers.get('authorization') || '';

  // 1) Bearer token (legacy client flow)
  if (admin && auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice('bearer '.length).trim();
    if (token) {
      const { data, error } = await admin.auth.getUser(token);
      if (!error && data.user) return data.user;
    }
  }

  // 2) Cookie-based session (best UX for opening in a new tab)
  try {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.getUser();
    if (!error && data.user) return data.user;
  } catch {
    // ignore
  }

  return null;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();
  if (!admin) return json({ error: 'Supabase admin not configured' }, 503, requestId);
  if (!serverEnv.LINK_TOKEN_SECRET) return json({ error: 'LINK_TOKEN_SECRET not configured' }, 503, requestId);

  const { session_id } = await ctx.params;

  const user = await resolveUser(req);
  if (!user) return json({ error: 'Unauthorized' }, 401, requestId);

  const { data, error: bookingErr } = await admin
    .from('bookings')
    .select('id,user_id,customer_email,stripe_session_id')
    .eq('stripe_session_id', session_id)
    .maybeSingle();

  if (bookingErr) return json({ error: bookingErr.message }, 500, requestId);

  // 👇 Tipado explícito para evitar "never"
  const booking = (data as BookingRow | null) ?? null;

  if (!booking) return json({ error: 'Booking not found' }, 404, requestId);

  const email = (user.email || '').toLowerCase();
  const bookingEmail = (booking.customer_email || '').toLowerCase();

  // Authorization rule:
  // - If the booking has user_id, it must match.
  // - If user_id is null (guest checkout), allow if the signed-in email matches.
  const ownsBooking =
    (booking.user_id != null && booking.user_id === user.id) ||
    (booking.user_id == null && email && email === bookingEmail);

  if (!ownsBooking) return json({ error: 'Forbidden' }, 403, requestId);

  // Create a short-lived signed token and redirect to the public invoice endpoint.
  // This avoids client-side blob downloads (better on mobile).
  const t = signLinkToken({
    sessionId: session_id,
    secret: serverEnv.LINK_TOKEN_SECRET,
    ttlSeconds: 60 * 30,
  });

  const url = new URL(`/api/invoice/${session_id}`, req.url);
  const requestedDownload = (new URL(req.url).searchParams.get('download') || '').toLowerCase();
  const forceDownload = ['1', 'true', 'yes'].includes(requestedDownload);

  url.searchParams.set('t', t);
  url.searchParams.set('download', forceDownload ? '1' : '0');

  return NextResponse.redirect(url, 303);
}
