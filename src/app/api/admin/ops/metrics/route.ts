// src/app/api/admin/ops/metrics/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Interfaz para tipar los incidentes dentro del agregador de métricas.
 */
interface MetricIncident {
  severity?: string;
  status?: string;
  kind?: string;
  count?: number | string;
  first_seen_at?: string | null;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
}

const QuerySchema = z.object({
  hours: z.coerce.number().int().min(1).max(168).default(24),
});

/**
 * Calcula la diferencia en milisegundos entre dos timestamps.
 */
function msBetween(start: string | null | undefined, end: string | null | undefined): number | null {
  if (!start || !end) return null;
  const dStart = new Date(start).getTime();
  const dEnd = new Date(end).getTime();
  if (isNaN(dStart) || isNaN(dEnd)) return null;
  return Math.max(0, dEnd - dStart);
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Servicio de base de datos no disponible', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      hours: url.searchParams.get('hours') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Parámetros inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { hours: windowHours } = parsed.data;
    const sinceIso = new Date(Date.now() - windowHours * 3600_000).toISOString();
    const db = admin as any; // Bypass temporal para tablas Ops

    // 1. Consultas en Paralelo (Eficiencia Next.js 15)
    const [incidentsRes, pausesRes] = await Promise.all([
      db.from('ops_incidents')
        .select('severity, status, kind, count, first_seen_at, last_seen_at, acknowledged_at, resolved_at')
        .gte('last_seen_at', sinceIso)
        .order('last_seen_at', { ascending: false })
        .limit(1000),
      db.from('crm_channel_pauses')
        .select('channel, paused_until, reason')
        .gt('paused_until', new Date().toISOString())
        .order('paused_until', { ascending: true })
        .limit(10)
    ]);

    if (incidentsRes.error) throw incidentsRes.error;

    // 2. Procesamiento de Métricas (O(N))
    const items: MetricIncident[] = incidentsRes.data || [];
    const metrics = {
      bySeverity: { info: 0, warn: 0, critical: 0 } as Record<string, number>,
      byStatus: { open: 0, acked: 0, resolved: 0 } as Record<string, number>,
      byKind: {} as Record<string, number>,
      sla: { ackSum: 0, ackCount: 0, resolveSum: 0, resolveCount: 0 }
    };

    for (const it of items) {
      const c = Math.max(1, Number(it.count || 1));
      const sev = String(it.severity || 'info');
      const st = String(it.status || 'open');
      const kind = String(it.kind || 'unknown');

      metrics.bySeverity[sev] = (metrics.bySeverity[sev] ?? 0) + c;
      metrics.byStatus[st] = (metrics.byStatus[st] ?? 0) + c;
      metrics.byKind[kind] = (metrics.byKind[kind] ?? 0) + c;

      // Cálculo de SLAs (MTTA / MTTR)
      const ackMs = msBetween(it.first_seen_at, it.acknowledged_at);
      if (ackMs !== null) {
        metrics.sla.ackSum += ackMs;
        metrics.sla.ackCount++;
      }

      const resMs = msBetween(it.first_seen_at, it.resolved_at);
      if (resMs !== null) {
        metrics.sla.resolveSum += resMs;
        metrics.sla.resolveCount++;
      }
    }

    // 3. Formateo de Top Kinds
    const topKinds = Object.entries(metrics.byKind)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([kind, total]) => ({ kind, total }));

    // 4. Respuesta Consolidada (Fix TS: s y r tipados)
    return NextResponse.json(
      {
        requestId,
        window: { hours: windowHours, since: sinceIso },
        totals: {
          incidents: items.reduce((s: number, r: MetricIncident) => s + Math.max(1, Number(r.count || 1)), 0),
          bySeverity: metrics.bySeverity,
          byStatus: metrics.byStatus,
        },
        sla: {
          avgAckMs: metrics.sla.ackCount ? Math.round(metrics.sla.ackSum / metrics.sla.ackCount) : null,
          avgResolveMs: metrics.sla.resolveCount ? Math.round(metrics.sla.resolveSum / metrics.sla.resolveCount) : null,
        },
        topKinds,
        pauses: pausesRes.data ?? [],
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido en métricas';
    
    await logEvent('api.error', { 
      requestId, 
      route: '/api/admin/ops/metrics', 
      message: errorMessage 
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo al procesar métricas operativas', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}