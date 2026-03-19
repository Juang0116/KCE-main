import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Validador de formato de fecha YYYY-MM-DD
const Ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const QuerySchema = z.object({
  status: z.enum(['pending', 'paid', 'canceled']).optional(),
  q: z.string().optional(),
  created_from: Ymd.optional(),
  created_to: Ymd.optional(),
  tour_slug: z.string().max(160).optional(),
  tour_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

// Helpers para normalización de fechas en queries de base de datos
const ymdToIsoStart = (ymd: string) => `${ymd}T00:00:00.000Z`;

const ymdToIsoEndExclusive = (ymd: string) => {
  const [ys, ms, ds] = ymd.split('-');
  const y = Number(ys), m = Number(ms), d = Number(ds);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return `${ymd}T00:00:00.000Z`;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString();
};

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  // 1. Verificación de Seguridad
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      status: url.searchParams.get('status') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      created_from: url.searchParams.get('from') ?? url.searchParams.get('created_from') ?? undefined,
      created_to: url.searchParams.get('to') ?? url.searchParams.get('created_to') ?? undefined,
      tour_slug: url.searchParams.get('tour') ?? url.searchParams.get('tour_slug') ?? undefined,
      tour_id: url.searchParams.get('tour_id') ?? undefined,
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros de búsqueda inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { status, q, created_from, created_to, tour_slug, tour_id, page, limit } = parsed.data;
    
    // 2. Cálculo de Paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Supabase admin not configured');

    // 3. Construcción de Query relacional
    let query = (admin as any)
      .from('bookings')
      .select(
        'id, status, stripe_session_id, total, currency, origin_currency, tour_price_minor, date, persons, customer_email, customer_name, phone, created_at, tour_id, tours(title, slug, city)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    // Aplicación de filtros dinámicos
    if (status) query = query.eq('status', status);
    if (tour_id) query = query.eq('tour_id', tour_id);
    if (tour_slug) query = query.eq('tours.slug', tour_slug);
    if (created_from) query = query.gte('created_at', ymdToIsoStart(created_from));
    if (created_to) query = query.lt('created_at', ymdToIsoEndExclusive(created_to));

    // Búsqueda textual (ilike) en columnas clave
    if (q?.trim()) {
      const searchTerm = q.trim();
      query = query.or(
        `customer_email.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,stripe_session_id.ilike.%${searchTerm}%`
      );
    }

    const { data, count, error } = await query;

    if (error) {
      void logEvent('api.error', { route: '/api/admin/bookings', message: error.message, requestId }, { userId: auth.actor ?? null });
      return NextResponse.json({ error: 'Error de base de datos', requestId }, { status: 500 });
    }

    // 4. Respuesta paginada exitosa
    return NextResponse.json(
      { 
        items: data ?? [], 
        page, 
        limit, 
        total: count ?? 0, 
        requestId 
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (err: any) {
    void logEvent('api.error', { route: '/api/admin/bookings', message: err.message, requestId }, { userId: auth.actor ?? null });
    return NextResponse.json(
      { error: 'Error interno inesperado', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}