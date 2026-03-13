// src/app/api/admin/ops/metrics/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function num(n: any): number {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function msBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (!Number.isFinite(da) || !Number.isFinite(db)) return null;
  return Math.max(0, db - da);
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin() as any;

  const now = Date.now();
  const windowHours = Math.max(1, Math.min(168, Number(req.nextUrl.searchParams.get('hours') || 24)));
  const sinceIso = new Date(now - windowHours * 3600_000).toISOString();

  // Pull a bounded set and aggregate in node (keeps it portable).
  const res = await admin
    .from('ops_incidents')
    .select('id,severity,kind,status,count,first_seen_at,last_seen_at,acknowledged_at,resolved_at')
    .gte('last_seen_at', sinceIso)
    .order('last_seen_at', { ascending: false })
    .limit(1000);

  if (res.error) {
    return NextResponse.json(
      { error: res.error.message || 'failed_to_load', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  const items = Array.isArray(res.data) ? res.data : [];

  const bySeverity: Record<string, number> = { info: 0, warn: 0, critical: 0 };
  const byStatus: Record<string, number> = { open: 0, acked: 0, resolved: 0 };
  const byKind: Record<string, number> = {};

  let ackMsSum = 0;
  let ackMsN = 0;
  let resolveMsSum = 0;
  let resolveMsN = 0;

  for (const it of items) {
    const sev = String((it as any).severity || 'info');
    const st = String((it as any).status || 'open');
    const kind = String((it as any).kind || 'unknown');
    const c = Math.max(1, num((it as any).count));

    bySeverity[sev] = (bySeverity[sev] ?? 0) + c;
    byStatus[st] = (byStatus[st] ?? 0) + c;
    byKind[kind] = (byKind[kind] ?? 0) + c;

    const first = (it as any).first_seen_at as string | null;
    const ack = (it as any).acknowledged_at as string | null;
    const resolved = (it as any).resolved_at as string | null;

    const ams = msBetween(first, ack);
    if (ams != null) {
      ackMsSum += ams;
      ackMsN += 1;
    }
    const rms = msBetween(first, resolved);
    if (rms != null) {
      resolveMsSum += rms;
      resolveMsN += 1;
    }
  }

  const topKinds = Object.entries(byKind)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([kind, total]) => ({ kind, total }));

  const avgAckMs = ackMsN ? Math.round(ackMsSum / ackMsN) : null;
  const avgResolveMs = resolveMsN ? Math.round(resolveMsSum / resolveMsN) : null;

  // Current pauses snapshot.
  const pausesRes = await admin
    .from('crm_channel_pauses')
    .select('channel,paused_until,reason')
    .gt('paused_until', new Date().toISOString())
    .order('paused_until', { ascending: true })
    .limit(10);

  const pauses = pausesRes?.error ? [] : (pausesRes.data ?? []);

  return NextResponse.json(
    {
      requestId,
      window: { hours: windowHours, since: sinceIso },
      totals: {
        incidents: items.reduce((s: number, r: any) => s + Math.max(1, num(r.count)), 0),
        bySeverity,
        byStatus,
      },
      sla: {
        avgAckMs,
        avgResolveMs,
      },
      topKinds,
      pauses,
    },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
