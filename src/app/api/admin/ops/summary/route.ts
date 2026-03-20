// src/app/api/admin/ops/summary/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Genera un resumen ejecutivo en tiempo real para el Command Center de KCE.
 */
export async function GET(req: NextRequest) {
  // 1. Seguridad y Contexto
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Servicio de administración no disponible', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    const db = admin as any; // Bypass temporal de tipos
    const today = new Date().toISOString().slice(0, 10);

    // 2. Extracción Masiva en Paralelo
    // Ejecutamos todas las consultas simultáneamente para optimizar el TTFB
    const results = await Promise.all([
      db.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      db.from('leads').select('*', { count: 'exact', head: true }).not('stage', 'in', '(won,lost,archived)'),
      db.from('deals').select('stage, updated_at, amount_minor').not('stage', 'in', '(won,lost)'),
      db.from('bookings').select('id, tour_title, customer_name, tour_date, status')
        .gte('tour_date', today).eq('status', 'confirmed').order('tour_date').limit(5),
      db.from('events').select('type, source, created_at')
        .in('source', ['ops_agent', 'review_agent'])
        .gte('created_at', `${today}T00:00:00Z`)
        .order('created_at', { ascending: false }).limit(20),
      db.from('crm_sequence_enrollments').select('id, sequence_id, status, current_step, next_run_at')
        .eq('status', 'active').order('next_run_at').limit(10),
      db.from('crm_outbound_messages').select('id, status, to_email, subject, created_at, metadata')
        .or("metadata->>'agent'.eq.ops_agent,metadata->>'agent'.eq.review_agent")
        .order('created_at', { ascending: false }).limit(10),
    ]);

    // 3. Procesamiento y Manejo de Errores Parciales
    const [t, l, d, b, e, s, m] = results;

    // Si hay errores críticos en BD, logueamos pero intentamos seguir con lo que haya
    if (results.some(r => r.error)) {
      await logEvent('api.error', { 
        requestId, 
        where: 'ops.summary.partial_failure', 
        details: results.filter(r => r.error).map(r => r.error?.message) 
      });
    }

    // Cálculos de KPIs de Ventas
    const dealList = (d.data ?? []) as Array<{ stage: string; updated_at: string; amount_minor: number | null }>;
    const staleThreshold = Date.now() - 3 * 86400000; // 3 días de inactividad

    const staleDealsCount = dealList.filter(
      (deal) => new Date(deal.updated_at).getTime() < staleThreshold
    ).length;

    const potentialRevenue = dealList
      .filter((deal) => ['qualified', 'proposal', 'checkout'].includes(deal.stage))
      .reduce((acc, deal) => acc + (deal.amount_minor ?? 50000) / 100, 0);

    // Métricas de Agentes de IA
    const agentEvents = e.data ?? [];
    const agentMessages = m.data ?? [];

    const agentStats = {
      ops: {
        today: agentEvents.filter((ev: any) => ev.source === 'ops_agent' && ev.type === 'ops_agent.completed').length,
        emails: agentMessages.filter((msg: any) => msg.metadata?.agent === 'ops_agent').length,
      },
      review: {
        today: agentEvents.filter((ev: any) => ev.source === 'review_agent' && ev.type === 'review_agent.completed').length,
        emails: agentMessages.filter((msg: any) => msg.metadata?.agent === 'review_agent').length,
      },
    };

    // 4. Registro de auditoría
    await logEvent('ops.summary.generated', { 
      requestId, 
      openTasks: t.count, 
      revenue: Math.round(potentialRevenue) 
    });

    // 5. Respuesta Consolidada
    return NextResponse.json({
      ok: true,
      requestId,
      kpis: {
        openTasks: t.count ?? 0,
        activeLeads: l.count ?? 0,
        staleDeals: staleDealsCount,
        potentialRevenue: Math.round(potentialRevenue),
        todayBookings: (b.data ?? []).filter((book: any) => book.tour_date === today).length,
        activeEnrollments: (s.data ?? []).length,
      },
      agents: agentStats,
      upcomingBookings: b.data ?? [],
      recentAgentEvents: agentEvents,
      activeSequences: s.data ?? [],
    }, { 
      status: 200, 
      headers: withRequestId(undefined, requestId) 
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido al generar resumen operativo';
    
    await logEvent('api.error', { requestId, route: '/api/admin/ops/summary', message: msg });

    return NextResponse.json(
      { ok: false, error: 'Fallo al procesar el Command Center', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}