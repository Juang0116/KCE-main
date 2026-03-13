// src/lib/incidentSla.server.ts
import 'server-only';

import type { NextRequest } from 'next/server';

import { getSupabaseAdminAny } from '@/lib/supabaseAdminAny.server';
import { logEvent } from '@/lib/events.server';
import { maybeNotifyOpsAlert } from '@/lib/opsAlerts.server';

export type SlaBreach = {
  incidentId: string;
  kind: 'ack_overdue' | 'resolve_overdue';
  severity: 'info' | 'warn' | 'critical';
  message: string;
  minutesOverdue: number;
};

function numFromEnv(v: string | undefined, fallback: number): number {
  const n = Number(String(v ?? '').trim());
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function checkIncidentSla(
  req: NextRequest,
  params: { requestId: string; dryRun?: boolean },
): Promise<{ ok: boolean; breaches: SlaBreach[] }> {
  const requestId = params.requestId;
  const dryRun = Boolean(params.dryRun);

  const ackSlaMin = numFromEnv(process.env.OPS_INCIDENT_ACK_SLA_MINUTES, 30);
  const resolveSlaMin = numFromEnv(process.env.OPS_INCIDENT_RESOLVE_SLA_MINUTES, 240);

  const admin = getSupabaseAdminAny();
  const now = Date.now();

  const breaches: SlaBreach[] = [];

  // Fetch open/acked incidents; bounded to avoid heavy scans.
  const { data: rows, error } = await admin
    .from('ops_incidents')
    .select('id, severity, status, created_at, acknowledged_at, resolved_at')
    .in('status', ['open', 'acked'])
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    await logEvent(
      'api.error',
      { requestId, where: 'checkIncidentSla', error: error.message },
      { source: 'ops' },
    );
    return { ok: false, breaches: [] };
  }

  for (const r of (rows ?? []) as any[]) {
    const id = String(r?.id ?? '');
    if (!id) continue;

    const createdAtMs = r?.created_at ? new Date(String(r.created_at)).getTime() : NaN;
    if (!Number.isFinite(createdAtMs)) continue;

    const ackAtMs = r?.acknowledged_at ? new Date(String(r.acknowledged_at)).getTime() : null;
    const resolvedAtMs = r?.resolved_at ? new Date(String(r.resolved_at)).getTime() : null;

    // Ack SLA: still unacked, older than ackSlaMin.
    if (!ackAtMs && !resolvedAtMs) {
      const minutes = Math.floor((now - createdAtMs) / 60_000);
      const overdue = minutes - ackSlaMin;
      if (overdue > 0) {
        const sev: SlaBreach['severity'] = overdue > ackSlaMin ? 'critical' : 'warn';
        breaches.push({
          incidentId: id,
          kind: 'ack_overdue',
          severity: sev,
          minutesOverdue: overdue,
          message: `Incident ${id} is ACK overdue by ${overdue}m`,
        });
      }
    }

    // Resolve SLA: not resolved, older than resolveSlaMin since ack (or created).
    if (!resolvedAtMs) {
      const base = ackAtMs ?? createdAtMs;
      const minutes = Math.floor((now - base) / 60_000);
      const overdue = minutes - resolveSlaMin;
      if (overdue > 0) {
        const sev: SlaBreach['severity'] = overdue > resolveSlaMin ? 'critical' : 'warn';
        breaches.push({
          incidentId: id,
          kind: 'resolve_overdue',
          severity: sev,
          minutesOverdue: overdue,
          message: `Incident ${id} is RESOLVE overdue by ${overdue}m`,
        });
      }
    }
  }

  // Notify + event log (deduped).
  for (const b of breaches) {
    const dedupeKey = `sla:${b.kind}:${b.incidentId}:${Math.floor(b.minutesOverdue / 30)}`;

    await logEvent(
      'ops.incident.sla_breach',
      { requestId, ...b, dryRun },
      { source: 'ops', dedupeKey },
    );

    if (!dryRun) {
      await maybeNotifyOpsAlert(req, {
        requestId,
        severity: b.severity,
        kind: `incident_${b.kind}`,
        message: b.message,
        meta: {
          incidentId: b.incidentId,
          kind: b.kind,
          minutesOverdue: b.minutesOverdue,
          ackSlaMin,
          resolveSlaMin,
          dedupeKey,
        },
      });
    }
  }

  return { ok: true, breaches };
}
