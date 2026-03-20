// src/app/api/admin/metrics/cta-revenue/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(10).max(1000).default(200),
});

function ymdToIsoStart(ymd: string) {
  return `${ymd}T00:00:00.000Z`;
}

function ymdToIsoEndExclusive(ymd: string) {
  const [ys, ms, ds] = ymd.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return `${ymd}T00:00:00.000Z`;
  }
  
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString();
}

type EventRow = {
  payload: any;
  created_at: string;
};

function safeStr(v: unknown, max = 200): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function safeInt(v: unknown): number {
  const n = Number.parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(req: NextRequest) {
  // 1. Autenticación y configuración inicial
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 2. Parseo y validación de fechas seguras
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const now = new Date();
    const toYMD = parsed.data.to ?? now.toISOString().slice(0, 10);
    const fromYMD = parsed.data.from ?? new Date(now.getTime() - 29 * 86400000).toISOString().slice(0, 10);

    const fromIso = ymdToIsoStart(fromYMD);
    const toIso = ymdToIsoEndExclusive(toYMD);

    const db = admin as any; // Workaround temporal para tipos inestables

    // 3. Extracción de eventos de ingresos (Límite dinámico 20k)
    const { data, error: dbError } = await db
      .from('events')
      .select('payload, created_at')
      .eq('type', 'checkout.paid')
      .gte('created_at', fromIso)
      .lt('created_at', toIso)
      .order('created_at', { ascending: false })
      .limit(20000);

    if (dbError) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/metrics/cta-revenue', message: dbError.message },
        { source: 'api' }
      );
      return NextResponse.json(
        { error: 'Error al cargar los eventos de ingresos', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) }
      );
    }

    const rows: EventRow[] = Array.isArray(data) ? data : [];

    // Alerta preventiva de escalabilidad para el equipo Ops
    if (rows.length >= 20000) {
      await logEvent(
        'metrics.fallback_truncated',
        { requestId, fromYMD, toYMD, eventCount: rows.length, aggregator: 'cta-revenue' },
        { source: 'system' }
      );
    }

    // 4. Procesamiento y Atribución en memoria
    const byCta = new Map<
      string,
      { cta: string; paid: number; revenue_minor: number; currency: string; last: string }
    >();

    for (const r of rows) {
      const p = r.payload || {};
      const cta = safeStr(p.cta, 120) || 'unknown';
      const currency = safeStr(p.currency, 6) || 'EUR';
      const amt = safeInt(p.amount_total_minor);

      // Clave compuesta para separar ingresos en distintas monedas si el negocio lo requiere
      const k = `${cta}__${currency}`;
      const prev = byCta.get(k);

      if (!prev) {
        byCta.set(k, { cta, paid: 1, revenue_minor: amt, currency, last: r.created_at });
      } else {
        prev.paid += 1;
        prev.revenue_minor += amt;
        if (r.created_at > prev.last) {
          prev.last = r.created_at;
        }
      }
    }

    // 5. Transformación y Ordenamiento (Mayor ingreso primero)
    const items = Array.from(byCta.values())
      .sort((a, b) => b.revenue_minor - a.revenue_minor)
      .slice(0, parsed.data.limit);

    return NextResponse.json(
      {
        ok: true,
        window: { from: fromYMD, to: toYMD },
        counts: { events: rows.length, ctas: byCta.size },
        items,
        requestId,
      },
      { headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al calcular atribución de ingresos';
    
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/cta-revenue', message: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}