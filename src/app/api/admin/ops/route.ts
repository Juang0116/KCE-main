// src/app/api/admin/ops/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope, getAdminActor } from '@/lib/adminAuth';
import { getChannelPause } from '@/lib/channelPause.server';
import { getRuntimeFlagBoolean } from '@/lib/runtimeFlags.server';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function dayRangeISO(tz: string) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value);
  const d = Number(parts.find((p) => p.type === 'day')?.value);

  const from = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const to = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0));
  return { from: from.toISOString(), to: to.toISOString() };
}

function envBool(name: string, fallback: boolean) {
  const v = (process.env[name] || '').trim().toLowerCase();
  if (!v) return fallback;
  return !['0', 'false', 'no', 'off'].includes(v);
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const actor = ((await getAdminActor(req)) || 'admin').toString();

  const tz = 'America/Bogota';
  const range = dayRangeISO(tz);

  // ---------- Controls (runtime flags + channel pauses) ----------
  // Env default (if no runtime override exists)
  const autoPromoteDefault = envBool('CRM_AUTO_PROMOTE_WEIGHTS', true);
  const autoPromoteEnabled = await getRuntimeFlagBoolean('crm_auto_promote_weights', autoPromoteDefault);

  const adminAny = getSupabaseAdmin() as any;

  // Best-effort: show whether runtime override exists
  const autoPromoteRow = await adminAny
    .from('crm_runtime_flags')
    .select('value,updated_at')
    .eq('key', 'crm_auto_promote_weights')
    .maybeSingle();

  const emailPause = await getChannelPause('email');

  const controls = {
    auto_promote: {
      enabled: autoPromoteEnabled,
      override: autoPromoteRow?.data?.value != null ? 'runtime' : 'env',
      updated_at: autoPromoteRow?.data?.updated_at ?? null,
    },
    channel_pauses: {
      email: emailPause,
    },
  };

  try {
    const admin = adminAny;

    const nowIso = new Date().toISOString();

    const ticketsOpenQ = admin
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'pending', 'in_progress']);
    const ticketsUrgentQ = admin
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'pending', 'in_progress'])
      .eq('priority', 'urgent');
    const ticketsPendingQ = admin.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'pending');
    const ticketsInProgressQ = admin
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    const tasksOpenQ = admin.from('tasks').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']);
    const tasksUrgentQ = admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress'])
      .eq('priority', 'urgent');

    const tasksOverdueQ = admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress'])
      .lt('due_at', nowIso);

    const tasksDueTodayQ = admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress'])
      .gte('due_at', range.from)
      .lt('due_at', range.to);

    const [
      ticketsOpen,
      ticketsUrgent,
      ticketsPending,
      ticketsInProgress,
      tasksOpen,
      tasksUrgent,
      tasksOverdue,
      tasksDueToday,
    ] = await Promise.all([
      ticketsOpenQ,
      ticketsUrgentQ,
      ticketsPendingQ,
      ticketsInProgressQ,
      tasksOpenQ,
      tasksUrgentQ,
      tasksOverdueQ,
      tasksDueTodayQ,
    ]);

    // Deals by stage (best-effort)
    const dealsRes = await admin.from('deals').select('stage').limit(2000);
    const deals: Record<string, number> = {};
    for (const row of dealsRes.data ?? []) {
      const k = String(row.stage ?? 'unknown');
      deals[k] = (deals[k] ?? 0) + 1;
    }

    const urgentTicketsListRes = await admin
      .from('tickets')
      .select('id,subject,updated_at,priority')
      .in('status', ['open', 'pending', 'in_progress'])
      .eq('priority', 'urgent')
      .order('updated_at', { ascending: false })
      .limit(10);

    const overdueTasksListRes = await admin
      .from('tasks')
      .select('id,title,due_at,priority,ticket_id,deal_id')
      .in('status', ['open', 'in_progress'])
      .lt('due_at', nowIso)
      .order('due_at', { ascending: true })
      .limit(10);

    return NextResponse.json(
      {
        ok: true,
        requestId,
        actor,
        // access: null, // <- si luego quieres RBAC/breakglass real, lo añadimos con exports reales de rbac.server
        range: { tz, ...range },
        tickets: {
          open: ticketsOpen?.count ?? 0,
          pending: ticketsPending?.count ?? 0,
          in_progress: ticketsInProgress?.count ?? 0,
          urgent: ticketsUrgent?.count ?? 0,
        },
        tasks: {
          open: tasksOpen?.count ?? 0,
          overdue: tasksOverdue?.count ?? 0,
          due_today: tasksDueToday?.count ?? 0,
          urgent: tasksUrgent?.count ?? 0,
        },
        deals,
        lists: {
          urgent_tickets: urgentTicketsListRes.data ?? [],
          overdue_tasks: overdueTasksListRes.data ?? [],
        },
        controls,
      },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/ops', message: e instanceof Error ? e.message : 'unknown' },
      { source: 'api' },
    );

    // En error, igual devolvemos controls para que el panel no quede “ciego”
    return NextResponse.json(
      { ok: false, requestId, actor, error: 'Unexpected error', controls },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
