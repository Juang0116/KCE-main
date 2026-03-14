// src/app/api/admin/ops/summary/route.ts
// Real-time ops summary for the command center dashboard.
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin() as any;
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: openTasks },
    { count: activeLeads },
    { data: deals },
    { data: recentBookings },
    { data: agentEvents },
    { data: activeEnrollments },
    { data: recentMessages },
  ] = await Promise.all([
    admin.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('leads').select('*', { count: 'exact', head: true }).not('stage', 'in', '(won,lost,archived)'),
    admin.from('deals').select('stage, updated_at, amount_minor').not('stage', 'in', '(won,lost)'),
    admin.from('bookings').select('id, tour_title, customer_name, tour_date, status')
      .gte('tour_date', today).eq('status', 'confirmed').order('tour_date').limit(5),
    admin.from('events').select('type, source, created_at')
      .in('source', ['ops_agent', 'review_agent'])
      .gte('created_at', `${today}T00:00:00Z`)
      .order('created_at', { ascending: false }).limit(20),
    admin.from('crm_sequence_enrollments').select('id, sequence_id, status, current_step, next_run_at')
      .eq('status', 'active').order('next_run_at').limit(10),
    admin.from('crm_outbound_messages').select('id, status, to_email, subject, created_at, metadata')
      .or("metadata->>'agent'.eq.ops_agent,metadata->>'agent'.eq.review_agent")
      .order('created_at', { ascending: false }).limit(10),
  ]);

  type DealRow = { stage: string; updated_at: string; amount_minor: number | null };
  const dealList = (deals as DealRow[]) ?? [];

  const staleDeals = dealList.filter(
    (d) => Date.now() - new Date(d.updated_at).getTime() > 3 * 86_400_000
  ).length;

  const potentialRevenue = dealList
    .filter((d) => ['qualified', 'proposal', 'checkout'].includes(d.stage))
    .reduce((acc, d) => acc + (d.amount_minor ?? 50000) / 100, 0);

  const todayBookings = (recentBookings ?? []).filter(
    (b: any) => b.tour_date === today
  ).length;

  const agentStats = {
    ops: {
      today: (agentEvents ?? []).filter((e: any) => e.source === 'ops_agent' && e.type === 'ops_agent.completed').length,
      emails: (recentMessages ?? []).filter((m: any) => m.metadata?.agent === 'ops_agent').length,
    },
    review: {
      today: (agentEvents ?? []).filter((e: any) => e.source === 'review_agent' && e.type === 'review_agent.completed').length,
      emails: (recentMessages ?? []).filter((m: any) => m.metadata?.agent === 'review_agent').length,
    },
  };

  return NextResponse.json({
    ok: true,
    requestId,
    kpis: {
      openTasks: openTasks ?? 0,
      activeLeads: activeLeads ?? 0,
      staleDeals,
      potentialRevenue: Math.round(potentialRevenue),
      todayBookings,
      activeEnrollments: (activeEnrollments ?? []).length,
    },
    agents: agentStats,
    upcomingBookings: recentBookings ?? [],
    recentAgentEvents: agentEvents ?? [],
    activeSequences: activeEnrollments ?? [],
  }, { status: 200, headers: withRequestId(undefined, requestId) });
}
