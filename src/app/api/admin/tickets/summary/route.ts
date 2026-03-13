// src/app/api/admin/tickets/summary/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SLA_WARN_HOURS = 24;
const SLA_BREACH_HOURS = 48;

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Supabase admin not configured' },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  const statuses = ['open', 'pending', 'in_progress', 'resolved'];
  const counts: Record<string, number> = {};

  for (const st of statuses) {
    const r = await admin.from('tickets').select('id', { count: 'exact', head: true }).eq('status', st);
    counts[st] = r.count ?? 0;
  }

  // SLA (best-effort): based on created_at age for active tickets
  const warnCutoff = new Date(Date.now() - SLA_WARN_HOURS * 3600 * 1000).toISOString();
  const breachCutoff = new Date(Date.now() - SLA_BREACH_HOURS * 3600 * 1000).toISOString();

  const active = ['open', 'pending', 'in_progress'];

  const atRiskRes = await admin
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .in('status', active)
    .lt('created_at', warnCutoff);

  const breachRes = await admin
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .in('status', active)
    .lt('created_at', breachCutoff);

  return NextResponse.json(
    {
      ok: true,
      requestId,
      counts,
      sla: {
        warn_hours: SLA_WARN_HOURS,
        breach_hours: SLA_BREACH_HOURS,
        at_risk: atRiskRes.count ?? 0,
        breached: breachRes.count ?? 0,
      },
    },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
