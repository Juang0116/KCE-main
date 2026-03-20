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

/**
 * Genera el rango de tiempo del día actual en una zona horaria específica.
 * Corregido para evitar errores de tipado 'undefined' en Date.UTC.
 */
function dayRangeISO(tz: string) {
  const now = new Date();
  
  // Usamos el formato ISO de Canadá (en-CA) que es YYYY-MM-DD
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // fmt.format(now) nos da algo como "2026-03-19"
  const [y, m, d] = fmt.format(now).split('-').map((val) => parseInt(val, 10));

  // TypeScript ahora sabe que y, m, d son numbers gracias al map(parseInt)
  // Usamos fallbacks por si acaso el split falla (aunque con en-CA es seguro)
  const year = y || now.getUTCFullYear();
  const month = m || (now.getUTCMonth() + 1);
  const day = d || now.getUTCDate();

  const from = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const to = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));

  return { from: from.toISOString(), to: to.toISOString() };
}

function envBool(name: string, fallback: boolean): boolean {
  const v = (process.env[name] || '').trim().toLowerCase();
  if (!v) return fallback;
  return !['0', 'false', 'no', 'off'].includes(v);
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const actorRaw = await getAdminActor(req).catch(() => 'admin');
  const actor = String(actorRaw);

  const tz = 'America/Bogota';
  const range = dayRangeISO(tz);

  // ---------- Controls (runtime flags + channel pauses) ----------
  const autoPromoteDefault = envBool('CRM_AUTO_PROMOTE_WEIGHTS', true);
  const autoPromoteEnabled = await getRuntimeFlagBoolean('crm_auto_promote_weights', autoPromoteDefault);

  const admin = getSupabaseAdmin() as any;

  // Consultas iniciales de infraestructura
  const [autoPromoteRow, emailPause] = await Promise.all([
    admin.from('crm_runtime_flags').select('value, updated_at').eq('key', 'crm_auto_promote_weights').maybeSingle(),
    getChannelPause('email')
  ]);

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
    const nowIso = new Date().toISOString();

    // Orquestación de consultas de negocio
    const [
      ticketsStats,
      tasksStats,
      dealsRes,
      urgentTicketsList,
      overdueTasksList
    ] = await Promise.all([
      // Estadísticas de Tickets
      Promise.all([
        admin.from('tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'pending', 'in_progress']),
        admin.from('tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'pending', 'in_progress']).eq('priority', 'urgent'),
        admin.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        admin.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
      ]),
      // Estadísticas de Tareas
      Promise.all([
        admin.from('tasks').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
        admin.from('tasks').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']).eq('priority', 'urgent'),
        admin.from('tasks').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']).lt('due_at', nowIso),
        admin.from('tasks').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']).gte('due_at', range.from).lt('due_at', range.to),
      ]),
      admin.from('deals').select('stage').limit(2000),
      admin.from('tickets').select('id,subject,updated_at,priority').in('status', ['open', 'pending', 'in_progress']).eq('priority', 'urgent').order('updated_at', { ascending: false }).limit(10),
      admin.from('tasks').select('id,title,due_at,priority,ticket_id,deal_id').in('status', ['open', 'in_progress']).lt('due_at', nowIso).order('due_at', { ascending: true }).limit(10)
    ]);

    // Agregación de Deals
    const deals = (dealsRes.data ?? []).reduce((acc: Record<string, number>, row: any) => {
      const k = String(row.stage ?? 'unknown');
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json(
      {
        ok: true,
        requestId,
        actor,
        range: { tz, ...range },
        tickets: {
          open: ticketsStats[0]?.count ?? 0,
          urgent: ticketsStats[1]?.count ?? 0,
          pending: ticketsStats[2]?.count ?? 0,
          in_progress: ticketsStats[3]?.count ?? 0,
        },
        tasks: {
          open: tasksStats[0]?.count ?? 0,
          urgent: tasksStats[1]?.count ?? 0,
          overdue: tasksStats[2]?.count ?? 0,
          due_today: tasksStats[3]?.count ?? 0,
        },
        deals,
        lists: {
          urgent_tickets: urgentTicketsList.data ?? [],
          overdue_tasks: overdueTasksList.data ?? [],
        },
        controls,
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    await logEvent('api.error', { requestId, route: '/api/admin/ops', message: errorMessage });

    return NextResponse.json(
      { ok: false, requestId, actor, error: 'Fallo al recuperar métricas operativas', controls },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}