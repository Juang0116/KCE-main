import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { assertAllowedOriginOrReferer } from '@/lib/requestGuards.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { verifyTurnstile } from '@/lib/turnstile.server';
import { getSupabasePublic } from '@/lib/supabasePublic';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Schema = z.object({
  kind: z.enum(['export','delete']),
  email: z.string().trim().email().max(200),
  name: z.string().trim().max(120).optional(),
  message: z.string().trim().max(2000).optional(),
  locale: z.string().trim().max(12).optional(),
  turnstileToken: z.string().trim().max(2048).optional(),
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const originErr = assertAllowedOriginOrReferer(req, { allowMissing: false, allowInternalHmac: false });
  if (originErr) return originErr;

  const rl = await checkRateLimit(req, { action: 'privacy.request', limit: 20, windowSeconds: 60 * 10, identity: 'ip+vid' });
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, requestId, error: 'Rate limit' }, { status: 429, headers: withRequestId(undefined, requestId) });
  }

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

  const ts = await verifyTurnstile(req, parsed.data.turnstileToken);
  if (!ts.ok) {
    return NextResponse.json({ ok: false, requestId, error: 'Turnstile failed' }, { status: 403, headers: withRequestId(undefined, requestId) });
  }


  try {
    const sb = getSupabasePublic();
    await sb.from('privacy_requests').insert({
      kind: parsed.data.kind,
      email: parsed.data.email,
      name: parsed.data.name ?? null,
      message: parsed.data.message ?? null,
      locale: parsed.data.locale ?? null,
      status: 'open',
    });
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
}
