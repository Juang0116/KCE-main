import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { assertAllowedOriginOrReferer, assertPayloadSize } from '@/lib/requestGuards.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabasePublic } from '@/lib/supabasePublic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Schema = z.object({
  metric: z.string().trim().min(2).max(64),
  value: z.number().nullable().optional(),
  rating: z.string().trim().max(16).optional(),
  page: z.string().trim().max(200).optional(),
  props: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const payloadErr = assertPayloadSize(req, 8_192);
  if (payloadErr) return payloadErr;

  const originErr = assertAllowedOriginOrReferer(req, { allowMissing: false, allowInternalHmac: false });
  if (originErr) return originErr;

  const rl = await checkRateLimit(req, { action: 'track.perf', limit: 120, windowSeconds: 60, identity: 'ip+vid' });
  if (!rl.allowed) return NextResponse.json({ ok: true, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, requestId, error: 'Invalid JSON' }, { status: 400, headers: withRequestId(undefined, requestId) });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, requestId, error: 'Invalid payload' }, { status: 400, headers: withRequestId(undefined, requestId) });
  }

  const vid = (req.cookies.get('kce_vid')?.value || '').slice(0, 64) || null;
  const ua = (req.headers.get('user-agent') || '').slice(0, 300) || null;
  const ref = (req.headers.get('referer') || '').slice(0, 500) || null;

  try {
    const sb = getSupabasePublic();
    await sb.from('web_vitals').insert({
      vid,
      metric: parsed.data.metric,
      value: parsed.data.value ?? null,
      rating: parsed.data.rating ?? null,
      page: parsed.data.page ?? null,
      user_agent: ua,
      referrer: ref,
      props: parsed.data.props ?? null,
    });
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
}
