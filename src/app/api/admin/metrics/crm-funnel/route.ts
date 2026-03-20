// src/app/api/admin/metrics/crm-funnel/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Esquema de validación para las fechas de consulta
const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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

/**
 * Función auxiliar refactorizada para recibir el cliente DB (Inyección de Dependencias),
 * asegurando que no se intente instanciar internamente si el entorno falla.
 */
async function countTable(db: any, table: string, fromIso: string, toIso: string, extra?: (q: any) => any) {
  let query = db
    .from(table)
    .select('id', { count: 'exact', head: true })
    .gte('created_at', fromIso)
    .lt('created_at', toIso);
    
  if (extra) query = extra(query);
  
  const res = await query;
  if (res.error) throw new Error(`Error contando tabla [${table}]: ${res.error.message}`);
  return res.count ?? 0;
}

/**
 * Función auxiliar refactorizada para conteo masivo de eventos usando el cliente DB inyectado.
 */
async function countEvents(db: any, types: string[], fromIso: string, toIso: string) {
  const res = await db
    .from('events')
    .select('id', { count: 'exact', head: true })
    .in('type', types)
    .gte('created_at', fromIso)
    .lt('created_at', toIso);
    
  if (res.error) throw new Error(`Error contando eventos [${types.join(', ')}]: ${res.error.message}`);
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
    // 2. Parseo y validación de fechas seguras
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
      Date.UTC(Number(toYMD.slice(0, 4)), Number(toYMD.slice(5, 7)) - 1, Number(toYMD.slice(8, 10)))
    );
    fromDate.setUTCDate(fromDate.getUTCDate() - 30);
    
    const fromYMD = parsed.data.from ?? fromDate.toISOString().slice(0, 10);

    const fromIso = ymdToIsoStart(fromYMD);
    const toIso = ymdToIsoEndExclusive(toYMD);

    const db = admin as any; // Workaround temporal para tipos "never" de Supabase

    // 3. Ejecución paralela masiva de los niveles del Funnel
    const [leads, tickets, deals, bookingsPaid, checkoutSessions, checkoutPaid] = await Promise.all([
      countTable(db, 'leads', fromIso, toIso),
      countTable(db, 'tickets', fromIso, toIso),
      countTable(db, 'deals', fromIso, toIso),
      countTable(db, 'bookings', fromIso, toIso, (q) => q.eq('status', 'paid')),
      countEvents(db, ['checkout.started', 'bot.checkout_started', 'bot.checkout_session_created'], fromIso, toIso),
      countEvents(db, ['checkout.paid', 'stripe.checkout.paid'], fromIso, toIso),
    ]);

    // 4. Cálculo de tasas de conversión (Rates)
    const rates = {
      ticketsPerLead: leads ? tickets / leads : 0,
      dealsPerTicket: tickets ? deals / tickets : 0,
      checkoutsPerDeal: deals ? checkoutSessions / deals : 0,
      paidPerCheckout: checkoutSessions ? checkoutPaid / checkoutSessions : 0,
      paidBookingsPerPaidEvent: checkoutPaid ? bookingsPaid / checkoutPaid : 0,
    };

    return NextResponse.json(
      {
        ok: true,
        window: { from: fromYMD, to: toYMD },
        counts: { leads, tickets, deals, checkoutSessions, checkoutPaid, bookingsPaid },
        rates,
        requestId,
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al calcular el funnel del CRM';
    
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/crm-funnel', message: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}