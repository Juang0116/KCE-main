import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { assertAllowedOriginOrReferer } from '@/lib/requestGuards.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';
import { getSupabasePublic } from '@/lib/supabasePublic';
import { readUtmFromCookies, utmCompactKey } from '@/lib/utm.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Schema = z.object({
  code: z.string().trim().min(2).max(64).regex(/^[a-z0-9][a-z0-9_-]+$/i),
  page: z.string().trim().max(200).optional(),
});

function ipHash(req: NextRequest): string | null {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim();
  if (!ip) return null;
  // best-effort / non-crypto hash: enough for coarse dedupe without storing raw IP
  let h = 0;
  for (let i = 0; i < ip.length; i++) h = (h * 31 + ip.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const originErr = assertAllowedOriginOrReferer(req, { allowMissing: false, allowInternalHmac: false });
  if (originErr) return originErr;

  const rl = await checkRateLimit(req, { action: 'affiliate.click', limit: 60, windowSeconds: 60, identity: 'ip+vid' });
  if (!rl.allowed) return NextResponse.json({ ok: true, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, requestId, error: 'Invalid JSON' }, { status: 400, headers: withRequestId(undefined, requestId) });
  }

  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, requestId, error: 'Invalid payload' }, { status: 400, headers: withRequestId(undefined, requestId) });
  }

  const { code, page } = parsed.data;
  const vid = (req.cookies.get('kce_vid')?.value || '').slice(0, 64) || null;
  const utm = readUtmFromCookies(req.cookies as any);
  const utm_key = utmCompactKey(utm);

  // log event regardless of DB availability
  await logEvent(
    'affiliate.click',
    {
      requestId,
      affiliate_code: code,
      page: page ?? null,
      vid,
      utm_key,
      ref: req.headers.get('referer') ?? null,
      ua: req.headers.get('user-agent') ?? null,
    },
    { source: 'web' },
  );

  // best-effort store click row (RLS allows anon insert)
  try {
    const sb = getSupabasePublic();
    await sb.from('affiliate_clicks').insert({
      affiliate_code: code,
      vid,
      utm_key,
      page: page ?? null,
      referrer: (req.headers.get('referer') || '').slice(0, 500) || null,
      user_agent: (req.headers.get('user-agent') || '').slice(0, 300) || null,
      ip_hash: ipHash(req),
    });
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
}
