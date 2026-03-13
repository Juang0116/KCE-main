import { NextResponse, type NextRequest } from 'next/server';

import { serverEnv } from '@/lib/env';
import { json } from '@/lib/http.server';
import { signLinkToken } from '@/lib/linkTokens.server';
import { getRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type BookingRow = {
  id: string;
  user_id: string | null;
  customer_email: string | null;
};

async function resolveUser(req: NextRequest) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  // 1) Bearer token (backward compatible)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const { data, error } = await admin.auth.getUser(token);
      if (!error && data.user) return data.user;
    }
  }

  // 2) Cookie session (preferred for browser)
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ session_id: string }> }) {
  const requestId = getRequestId(req.headers);

  const admin = getSupabaseAdmin();
  if (!admin) {
    return json({ ok: false, error: 'Supabase admin client not configured', requestId }, { status: 500 });
  }

  const { session_id } = await ctx.params;

  const user = await resolveUser(req);
  if (!user) {
    return json({ ok: false, error: 'Unauthorized', requestId }, { status: 401 });
  }

  const { data, error } = await admin
    .from('bookings')
    .select('id,user_id,customer_email')
    .eq('stripe_session_id', session_id)
    .maybeSingle();

  if (error) {
    return json({ ok: false, error: error.message, requestId }, { status: 500 });
  }

  // 👇 Tipado explícito para evitar "never"
  const booking = (data as BookingRow | null) ?? null;

  if (!booking) {
    return json({ ok: false, error: 'Booking not found', requestId }, { status: 404 });
  }

  const email = user.email ?? null;
  const owns =
    (booking.user_id != null && booking.user_id === user.id) ||
    (email != null && booking.customer_email != null && booking.customer_email === email);

  if (!owns) {
    return json({ ok: false, error: 'Forbidden', requestId }, { status: 403 });
  }

  if (!serverEnv.LINK_TOKEN_SECRET) {
    return json({ ok: false, error: 'LINK_TOKEN_SECRET not configured', requestId }, { status: 503 });
  }

  // Short-lived token; calendar links should be usable but not permanent.
  const token = signLinkToken({
    sessionId: session_id,
    secret: serverEnv.LINK_TOKEN_SECRET,
    ttlSeconds: 60 * 30,
  });

  const url = new URL(`/api/calendar/${session_id}`, req.url);
  url.searchParams.set('t', token);
  return NextResponse.redirect(url, 303);
}
