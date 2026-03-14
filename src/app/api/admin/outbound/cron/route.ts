import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { logEvent } from '@/lib/events.server';
import { processOutboundQueue } from '@/lib/outbound.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { requireInternalHmac } from '@/lib/internalHmac.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  dryRun: z.boolean().optional().default(false),
}).strict();

function getBearer(req: NextRequest) {
  const h = req.headers.get('authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m?.[1]?.trim() || '';
}

async function acquireCronLock(admin: any, key: string, ttlSeconds: number): Promise<boolean> {
  // Best-effort cleanup
  try {
    await admin.from('event_locks').delete().lt('expires_at', new Date().toISOString());
  } catch {}

  const nowIso = new Date().toISOString();
  const expIso = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  const attempts = [
    { scope: 'cron', key },
    { scope: 'global', key }, // backward compat
  ];

  for (const a of attempts) {
    const ins = await admin
      .from('event_locks')
      .insert({ scope: a.scope, key: a.key, owner: 'cron', acquired_at: nowIso, expires_at: expIso })
      .select('id')
      .maybeSingle();

    if (!ins.error && ins.data?.id) return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  // Cron endpoints already require a strong bearer token. Internal HMAC is optional here.
  const hmacErr = await requireInternalHmac(req, { required: false });
  if (hmacErr) return hmacErr;
  const requestId = getRequestId(req.headers);

  const token = getBearer(req);
  const expected = (process.env.CRON_SECRET || process.env.CRON_API_TOKEN || process.env.AUTOPILOT_API_TOKEN || '').trim();
  if (!expected || (token !== expected && req.headers.get('x-vercel-cron') !== '1')) {
    return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401, headers: withRequestId(undefined, requestId) });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    json = {};
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten(), requestId }, { status: 400, headers: withRequestId(undefined, requestId) });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase admin not configured', requestId }, { status: 500, headers: withRequestId(undefined, requestId) });
  }

  const locked = await acquireCronLock(admin, 'outbound', 15 * 60);
  if (!locked) {
    return NextResponse.json({ ok: true, skipped: true, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
  }

  try {
    const out = await processOutboundQueue({ limit: parsed.data.limit, dryRun: parsed.data.dryRun, requestId });
    await logEvent('cron.outbound', { requestId, ...out, dryRun: parsed.data.dryRun }, { source: 'cron', entityId: null, dedupeKey: null });
    return NextResponse.json({ ok: true, ...out, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || 'Cron failed'), requestId }, { status: 500, headers: withRequestId(undefined, requestId) });
  }
}
