// src/app/api/admin/metrics/funnel/route.ts
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
});

function ymdToIsoStart(ymd: string) {
  return `${ymd}T00:00:00.000Z`;
}

function ymdToIsoEndExclusive(ymd: string) {
  // Final exclusivo: inicio del día siguiente
  const [ys, ms, ds] = ymd.split('-');

  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);

  // Red de seguridad (aunque el schema de Zod valide el formato)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return `${ymd}T00:00:00.000Z`;
  }

  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString();
}

/**
 * Función auxiliar refactorizada con Inyección de Dependencias.
 * Recibe la instancia de la base de datos para reutilizar la conexión
 * y añade trazabilidad al mensaje de error.
 */
async function countEvents(db: any, type: string, fromIso: string, toIso: string) {
  const query = db
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('type', type)
    .gte('created_at', fromIso)
    .lt('created_at', toIso);

  const res = await query;
  if (res.error) {
    throw new Error(`Error contando evento [${type}]: ${res.error.message}`);
  }
  return res.count ?? 0;
}

export async function GET(req: NextRequest) {
  // 1. Autenticación y configuración inicial
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  // Validación crítica de entorno
  if (!admin) {
    return NextResponse.json(
      { error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 2. Parseo y validación de parámetros de fecha
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    // Ventana de tiempo por defecto: últimos 30 días
    const now = new Date();
    const toYMD = parsed.data.to ?? now.toISOString().slice(0, 10);

    const fromDate = new Date(
      Date.UTC(
        Number(toYMD.slice(0, 4)),
        Number(toYMD.slice(5, 7)) - 1,
        Number(toYMD.slice(8, 10))
      )
    );
    fromDate.setUTCDate(fromDate.getUTCDate() - 30);
    const fromYMD = parsed.data.from ?? fromDate.toISOString().slice(0, 10);

    const fromIso = ymdToIsoStart(fromYMD);
    const toIso = ymdToIsoEndExclusive(toYMD);

    const db = admin as any; // Workaround temporal para firmas de Supabase

    // 3. Ejecución paralela de los niveles del Core Funnel
    const [tourViews, checkoutStarted, checkoutPaid] = await Promise.all([
      countEvents(db, 'tour.view', fromIso, toIso),
      countEvents(db, 'checkout.started', fromIso, toIso),
      countEvents(db, 'checkout.paid', fromIso, toIso),
    ]);

    // 4. Cálculo de tasas de conversión
    const startRate = tourViews ? checkoutStarted / tourViews : 0;
    const paidRate = checkoutStarted ? checkoutPaid / checkoutStarted : 0;
    const overallRate = tourViews ? checkoutPaid / tourViews : 0;

    return NextResponse.json(
      {
        window: { from: fromYMD, to: toYMD },
        counts: { tourViews, checkoutStarted, checkoutPaid },
        rates: {
          startPerView: startRate,
          paidPerStart: paidRate,
          paidPerView: overallRate,
        },
        requestId,
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al calcular el embudo principal';
    
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/funnel', message: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}