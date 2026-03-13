// src/app/go/checkout/[deal_id]/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { serverEnv } from '@/lib/env';
import { logEvent } from '@/lib/events.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { verifyLinkToken } from '@/lib/linkTokens.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function textResponse(status: number, message: string) {
  return new NextResponse(message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ deal_id: string }> | { deal_id: string } },
) {
  const params = (await Promise.resolve(ctx.params)) as { deal_id?: string };
  const dealId = String(params.deal_id || '').trim();
  if (!dealId) return textResponse(400, 'Missing deal id');

  const token = (req.nextUrl.searchParams.get('t') || '').trim();
  if (!token) {
    return textResponse(
      403,
      'Missing token. Please use the secure payment link provided by KCE support.',
    );
  }

  const admin = getSupabaseAdmin() as any;
  const { data, error } = await admin
    .from('deals')
    .select('id,checkout_url,stripe_session_id,stage')
    .eq('id', dealId)
    .maybeSingle();

  if (error) return textResponse(500, 'Failed to load deal');
  if (!data) return textResponse(404, 'Deal not found');

  const checkoutUrl = String(data.checkout_url || '').trim();
  const sid = String(data.stripe_session_id || '').trim();
  if (!checkoutUrl || !sid) {
    return textResponse(404, 'Checkout link not available. Ask support to generate a new one.');
  }

  const secret = serverEnv.LINK_TOKEN_SECRET;
  if (!secret) return textResponse(500, 'LINK_TOKEN_SECRET not configured');

  const verified = verifyLinkToken({ token, secret, expectedSessionId: sid });
  if (!verified.ok) {
    return textResponse(403, `Invalid token (${verified.reason}). Request a new secure link.`);
  }

  // Track (best-effort)
  void logEvent(
    'checkout.opened',
    {
      deal_id: dealId,
      stripe_session_id: sid,
      stage: data.stage || null,
      ua: req.headers.get('user-agent') || null,
      ref: req.headers.get('referer') || null,
    },
    { source: 'go', entityId: sid, dedupeKey: `checkout.opened:${dealId}:${sid}` },
  );

  return NextResponse.redirect(checkoutUrl, 302);
}
