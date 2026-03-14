// src/app/api/admin/sales/autopilot/cron/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { logEvent } from '@/lib/events.server';
import { runAutopilot } from '@/lib/autopilot.server';
import { runSalesOutboundTriggers } from '@/lib/salesOutboundTriggers.server';
import { runTemplateOptimization } from '@/lib/templateOptimization.server';
import { evaluateAlerts } from '@/lib/alerting.server';
import { runMitigations } from '@/lib/mitigations.server';
import { runOpsAgent } from '@/lib/opsAgent.server';
import { runReviewAgent } from '@/lib/reviewAgent.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { requireInternalHmac } from '@/lib/internalHmac.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z
  .object({
    stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'checkout']).optional(),
    limit: z.coerce.number().int().min(10).max(800).optional().default(500),
    dryRun: z.boolean().optional().default(false),
  })
  .strict();

function getBearer(req: NextRequest) {
  const h = req.headers.get('authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m?.[1]?.trim() || '';
}

async function acquireCronLock(admin: any, key: string, ttlSeconds: number): Promise<boolean> {
  // Best-effort cleanup
  try {
    await admin.from('event_locks').delete().lt('expires_at', new Date().toISOString());
  } catch {
    // ignore
  }

  const nowIso = new Date().toISOString();
  const expIso = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  const attempts: Array<Record<string, any>> = [
    { key, scope: 'global', acquired_at: nowIso, expires_at: expIso, meta: { action: 'cron.autopilot' } },
    { key, expires_at: expIso },
    { key, created_at: nowIso },
    { key },
  ];

  for (const payload of attempts) {
    const r = await admin.from('event_locks').insert(payload).select('key').maybeSingle();
    if (!r.error && r.data?.key) return true;

    const msg = (r.error as any)?.message || '';
    const conflict = msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique');
    if (conflict) return false;

    const schemaMismatch =
      msg.includes('does not exist') ||
      msg.includes('violates not-null constraint') ||
      msg.includes('column') ||
      msg.includes('Unknown');
    if (!schemaMismatch) {
      // Unknown failure
      return false;
    }
  }

  return false;
}

export async function POST(req: NextRequest) {
  // Cron endpoints already require a strong bearer token. Internal HMAC is optional here.
  const hmacErr = await requireInternalHmac(req, { required: false });
  if (hmacErr) return hmacErr;

  const requestId = getRequestId(req.headers);

  // Auth: Bearer token or Vercel cron header
  const expected = (process.env.AUTOPILOT_API_TOKEN || process.env.CRON_SECRET || '').trim();
  const got = getBearer(req);
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  if (!isVercelCron && (!expected || got !== expected)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized', requestId },
      { status: 401, headers: withRequestId(undefined, requestId) },
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Supabase admin not configured', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  const bodyJson = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Bad body', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const { stage, limit, dryRun } = parsed.data;

  // Prevent overlap (serverless concurrency)
  const lockKey = 'cron:autopilot';
  const locked = await acquireCronLock(admin as any, lockKey, 15 * 60);
  if (!locked) {
    await logEvent('admin.autopilot_cron_skipped', { requestId, reason: 'lock_busy' }, { source: 'cron' });
    return NextResponse.json(
      { ok: true, requestId, skipped: true, reason: 'lock_busy' },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  }

  // P25: Alerting + auto-mitigation (best-effort; never blocks cron)
  let alerts: any[] = [];
  let mitigations: any[] = [];
  try {
    alerts = await evaluateAlerts({ dryRun, requestId });
    mitigations = await runMitigations(alerts as any, { dryRun, requestId });
  } catch (e) {
    await logEvent('api.error', { requestId, where: 'cron.alerting', error: String(e) });
  }

  try {
    // IMPORTANT: exactOptionalPropertyTypes -> DO NOT pass stage when it's undefined
    const autopilotParams = {
      admin: admin as any,
      requestId,
      dryRun,
      limit,
      source: 'cron' as const,
      ...(stage ? { stage } : {}),
    };

    const { dealsProcessed, tasksCreated } = await runAutopilot(autopilotParams as any);

    const outbound = await runSalesOutboundTriggers({ requestId, limit, dryRun });

    const templateOptimization = await runTemplateOptimization({
      requestId,
      days: 30,
      limit: 8000,
      minSamples: 40,
      lockDays: 7,
      applyWeights: !dryRun,
      source: 'cron',
    });

    // Ops agent: pre-tour reminders for tomorrow's bookings
    let opsResult: { processed: number; message?: string } = { processed: 0 };
    if (!dryRun) {
      try {
        opsResult = await runOpsAgent(requestId);
      } catch (e) {
        void logEvent('ops_agent.cron_error', { requestId, error: e instanceof Error ? e.message : String(e) }, { source: 'cron' });
      }
    }

    // Review agent: post-tour review requests for yesterday's bookings
    let reviewResult: { processed: number } = { processed: 0 };
    if (!dryRun) {
      try {
        reviewResult = await runReviewAgent(requestId);
      } catch (e) {
        void logEvent('review_agent.cron_error', { requestId, error: e instanceof Error ? e.message : String(e) }, { source: 'cron' });
      }
    }

    return NextResponse.json(
      {
        ok: true, requestId, dealsProcessed, tasksCreated, skipped: false,
        outbound, templateOptimization, alerts, mitigations,
        opsAgent: opsResult, reviewAgent: reviewResult,
      },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/sales/autopilot/cron', message: e instanceof Error ? e.message : 'unknown' },
      { source: 'cron' },
    );
    return NextResponse.json(
      { ok: false, error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
