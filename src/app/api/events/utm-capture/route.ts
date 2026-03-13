import 'server-only';

import crypto from 'node:crypto';

import { NextResponse, type NextRequest } from 'next/server';
import { assertAllowedOriginOrReferer } from '@/lib/requestGuards.server';
import { z } from 'zod';

import { logEvent } from '@/lib/events.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logSecurityEvent } from '@/lib/securityEvents.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UtmSchema = z.object({
  path: z.string().trim().max(300).optional().default(''),
  utm_source: z.string().trim().max(120).optional().default(''),
  utm_medium: z.string().trim().max(120).optional().default(''),
  utm_campaign: z.string().trim().max(160).optional().default(''),
  utm_term: z.string().trim().max(160).optional().default(''),
  utm_content: z.string().trim().max(160).optional().default(''),
  gclid: z.string().trim().max(200).optional().default(''),
  fbclid: z.string().trim().max(200).optional().default(''),
});

function getOrSetVisitorId(req: NextRequest, res: NextResponse) {
  const existing = req.cookies.get('kce_vid')?.value;
  if (existing) return existing;

  const vid = crypto.randomUUID();
  res.cookies.set('kce_vid', vid, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return vid;
}

function setUtmCookie(res: NextResponse, utm: Record<string, string>) {
  res.cookies.set('kce_utm', JSON.stringify(utm), {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
}

export async function POST(req: NextRequest) {
  const originErr = assertAllowedOriginOrReferer(req, { allowInternalHmac: true, allowMissing: false });
  if (originErr) return originErr;

  const reqId = getRequestId(req.headers);

  // Anti-spam: captura UTM debe ser barata y limitada.
  const rl = await checkRateLimit(req, {
    action: 'events.utm',
    limit: 60,
    windowSeconds: 60,
    identity: 'ip+vid',
  });
  if (!rl.allowed) {
    void logSecurityEvent(req, {
      severity: 'warn',
      kind: 'rate_limit',
      meta: { scope: 'events.utm', keyBase: rl.keyBase },
    });
    return NextResponse.json(
      { ok: false, error: 'Too many requests', requestId: reqId },
      { status: 429, headers: withRequestId(new Headers(), reqId) },
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  const parsed = UtmSchema.safeParse(body || {});
  const safe = parsed.success ? parsed.data : UtmSchema.parse({});

  const res = NextResponse.json(
    { ok: true, requestId: reqId },
    { headers: withRequestId(new Headers(), reqId) },
  );

  const vid = getOrSetVisitorId(req, res);

  const utm = safe;

  setUtmCookie(res, utm);

  const dedupeKeyParts = [utm.utm_source, utm.utm_campaign, utm.gclid, utm.fbclid].filter(Boolean);
  const dedupe_key = dedupeKeyParts.length
    ? `utm:${vid}:${dedupeKeyParts.join(':')}`
    : `utm:${vid}:${Math.floor(Date.now() / 5000)}`;

  void logEvent(
    'marketing.utm_capture',
    { requestId: reqId, vid, ...utm },
    { source: 'api/events/utm-capture', dedupeKey: dedupe_key, entityId: vid },
  );

  return res;
}
