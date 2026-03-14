import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireInternalHmac } from '@/lib/internalHmac.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';
import { createOutboundMessage } from '@/lib/outbound.server';

// 🤖 NUEVOS IMPORTES DE LOS AGENTES
import { runOpsAgent } from '@/lib/opsAgent.server';
import { runReviewAgent } from '@/lib/reviewAgent.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).optional().default(1),
  dryRun: z.coerce.boolean().optional().default(false),
});

function getBearer(req: NextRequest): string {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return (m?.[1] || '').trim();
}

type IncidentRow = {
  severity: 'info' | 'warn' | 'critical' | string | null;
  status: 'open' | 'acked' | 'resolved' | string | null;
  created_at: string;
};

type AlertRow = {
  severity: 'info' | 'warn' | 'critical' | string | null;
  fired_at: string;
};

export async function POST(req: NextRequest) {
  const hmacErr = await requireInternalHmac(req);
  if (hmacErr) return hmacErr;

  const requestId = getRequestId(req.headers);

  const token = getBearer(req);
  const expected = (process.env.CRON_SECRET || process.env.CRON_API_TOKEN || process.env.AUTOPILOT_API_TOKEN || '').trim();
  if (!expected || token !== expected) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Unauthorized' },
      { status: 401, headers: withRequestId(undefined, requestId) },
    );
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Invalid body', issues: parsed.error.issues },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const days = parsed.data.days;
  const dryRun = parsed.data.dryRun;

  const enabled = (process.env.OPS_DIGEST_ENABLED || '0').trim();
  if (enabled === '0') {
    return NextResponse.json(
      { ok: true, requestId, skipped: true, reason: 'OPS_DIGEST_ENABLED=0' },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  }

  const to = (process.env.OPS_DIGEST_EMAIL_TO || process.env.OPS_ALERT_EMAIL_TO || '').trim();
  if (!to) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Missing OPS_DIGEST_EMAIL_TO (or OPS_ALERT_EMAIL_TO)' },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  const admin = getSupabaseAdmin();
  const sb = admin as any;
  const now = new Date();
  const fromISO = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const incRes = await sb
    .from('ops_incidents')
    .select('severity, status, created_at')
    .gte('created_at', fromISO);

  const incRows: IncidentRow[] = Array.isArray(incRes?.data) ? (incRes.data as IncidentRow[]) : [];

  const counts = { info: 0, warn: 0, critical: 0, open: 0, acked: 0, resolved: 0 };
  for (const r of incRows) {
    const sev = ((r?.severity || 'info') as string).toLowerCase() as 'info' | 'warn' | 'critical';
    const st = ((r?.status || 'open') as string).toLowerCase() as 'open' | 'acked' | 'resolved';
    if (sev in counts) (counts as any)[sev] += 1;
    if (st in counts) (counts as any)[st] += 1;
  }

  const unresolvedRes = await sb
    .from('ops_incidents')
    .select('id', { count: 'exact', head: true })
    .in('status', ['open', 'acked']);

  const unresolved = typeof unresolvedRes?.count === 'number' ? unresolvedRes.count : 0;

  const alertRes = await sb
    .from('crm_alerts')
    .select('severity, fired_at')
    .gte('fired_at', fromISO)
    .order('fired_at', { ascending: false })
    .limit(200);

  const alertRows: AlertRow[] = Array.isArray(alertRes?.data) ? (alertRes.data as AlertRow[]) : [];

  const alertCounts = { info: 0, warn: 0, critical: 0 };
  for (const a of alertRows) {
    const s = ((a?.severity || 'warn') as string).toLowerCase();
    if (s in alertCounts) (alertCounts as any)[s] += 1;
  }

  const subjectPrefix = (process.env.OPS_DIGEST_SUBJECT_PREFIX || '[KCE Ops]').trim();
  const subject = `${subjectPrefix} Digest ${now.toISOString().slice(0, 10)} (last ${days}d)`;

  const body = [
    `# Ops digest (last ${days} day${days === 1 ? '' : 's'})`,
    ``,
    `**Window:** ${fromISO} → ${now.toISOString()}`,
    ``,
    `## Incidents`,
    `- Total in window: **${incRows.length}**`,
    `- By severity: info **${counts.info}**, warn **${counts.warn}**, critical **${counts.critical}**`,
    `- By status (window): open **${counts.open}**, acked **${counts.acked}**, resolved **${counts.resolved}**`,
    `- Unresolved total (now): **${unresolved}**`,
    ``,
    `## Alerts fired`,
    `- info **${alertCounts.info}**, warn **${alertCounts.warn}**, critical **${alertCounts.critical}**`,
    ``,
    `## Next actions`,
    `1) Revisa /admin/ops/incidents (unresolved primero)`,
    `2) Corre /admin/ops → Run alerts (si hay señales)`,
    `3) Si hay postmortems, sincroniza action items → /admin/tasks`,
    ``,
  ].join('\n');

  await logEvent('ops.digest.generated', {
    requestId,
    days,
    dryRun,
    to,
    counts,
    alertCounts,
    unresolved,
  });

  if (!dryRun) {
    await createOutboundMessage({
      channel: 'email',
      provider: 'system',
      status: 'queued',
      toEmail: to,
      subject,
      body,
      metadata: { kind: 'ops_digest', days, fromISO },
    });
  }

  // 🤖 DESPERTAR A LOS AGENTES AUTOMÁTICOS KCE
  let opsPreTourCount = 0;
  let reviewsPostTourCount = 0;
  
  if (!dryRun) {
    try {
      const opsResult = await runOpsAgent(requestId);
      opsPreTourCount = opsResult.processed;
      
      const revResult = await runReviewAgent(requestId);
      reviewsPostTourCount = revResult.processed;
    } catch (e) {
      console.error('[KCE Agents] Failed to run:', e);
    }
  }

  return NextResponse.json(
    { 
      ok: true, 
      requestId, 
      queued: !dryRun, 
      to, 
      subject, 
      counts, 
      alertCounts, 
      unresolved,
      agents: { opsPreTour: opsPreTourCount, reviewsPostTour: reviewsPostTourCount } 
    },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}