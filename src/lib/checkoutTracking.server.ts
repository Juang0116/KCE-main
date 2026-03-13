// src/lib/checkoutTracking.server.ts
import 'server-only';

import { SITE_URL } from '@/lib/env';
import { signLinkToken } from '@/lib/linkTokens.server';

function siteUrl(): string {
  const s = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || SITE_URL || '').trim();
  return s.replace(/\/+$/g, '');
}

export function buildTrackedCheckoutUrl(args: {
  dealId: string;
  stripeSessionId: string;
  ttlSeconds?: number;
}): string | null {
  const base = siteUrl();
  if (!base) return null;
  const secret = (process.env.LINK_TOKEN_SECRET || '').trim();
  if (!secret) return null;

  const token = signLinkToken({
    sessionId: args.stripeSessionId,
    secret,
    ttlSeconds: Math.max(60, Math.trunc(args.ttlSeconds ?? 60 * 60 * 24 * 14)),
  });

  // NOTE: avoid embedding the Stripe URL as a query param.
  // We look it up by deal_id server-side and redirect.
  return `${base}/go/checkout/${encodeURIComponent(args.dealId)}?t=${encodeURIComponent(token)}`;
}
