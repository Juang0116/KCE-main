import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const QuerySchema = z.object({
  status: z.enum(['pending', 'paid', 'canceled']).optional(),
  q: z.string().optional(),
  created_from: Ymd.optional(),
  created_to: Ymd.optional(),
  tour_slug: z.string().max(160).optional(),
  tour_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(2000),
});

// Helpers para fechas
const ymdToIsoStart = (ymd: string) => `${ymd}T00:00:00.000Z`;
const ymdToIsoEndExclusive = (ymd: string) => {
  const dt = new Date(ymd);
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString();
};

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[\n\r,\"]/.test(s)) {
    return `"${s.replace(/\"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  // 1. Rate Limiting: Protección de recursos
  const rl = await checkRateLimit(req, {
    action: 'admin.export.bookings',
    limit: 10,
    windowSeconds: 60,
  });

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes de exportación', requestId },
      { status: 429, headers: withRequestId({ 'Retry-After': '60' }, requestId) },
    );
  }

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      status: url.searchParams.get('status') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      created_from: url.searchParams.get('from') ?? url.searchParams.get('created_from') ?? undefined,
      created_to: url.searchParams.get('to') ?? url.searchParams.get('created_to') ?? undefined,
      tour_slug: url.searchParams.get('tour') ?? undefined,
      tour_id: url.searchParams.get('tour_id') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Filtros inválidos', details: parsed.error.flatten(), requestId }, { status: 400 });
    }

    const { status, q, created_from, created_to, tour_slug, tour_id, limit } = parsed.data;
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Supabase no configurado');

    // 2. Query con Relaciones (Join con Tours)
    let query = (admin as any)
      .from('bookings')
      .select('id, status, stripe_session_id, total, currency, date, persons, customer_email, customer_name, phone, created_at, tours(title, slug, city)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);
    if (tour_id) query = query.eq('tour_id', tour_id);
    if (tour_slug) query = query.eq('tours.slug', tour_slug);
    if (created_from) query = query.gte('created_at', ymdToIsoStart(created_from));
    if (created_to) query = query.lt('created_at', ymdToIsoEndExclusive(created_to));

    if (q?.trim()) {
      const searchTerm = q.trim();
      query = query.or(`customer_email.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,stripe_session_id.ilike.%${searchTerm}%`);
    }

    const { data: rows, error: dbError } = await query;
    if (dbError) throw dbError;

    // 3. Auditoría de Exportación (Corregido Error 2379)
    void logEvent(
      'admin.bookings_exported', 
      { count: rows?.length || 0, requestId, filters: parsed.data }, 
      { userId: auth.actor ?? null, source: 'admin' }
    );

    // 4. Construcción del CSV
    const headers = [
      'Fecha Creación', 'Estado', 'Stripe ID', 'Tour', 'Ciudad', 'Fecha Tour', 
      'Pax', 'Total (Centavos)', 'Moneda', 'Cliente', 'Email', 'Teléfono', 'Booking ID'
    ].join(',');

    const lines = [headers];
    for (const b of (rows || []) as any[]) {
      const tour = b.tours || {};
      lines.push([
        csvEscape(b.created_at),
        csvEscape(b.status),
        csvEscape(b.stripe_session_id),
        csvEscape(tour.title),
        csvEscape(tour.city),
        csvEscape(b.date),
        csvEscape(b.persons),
        csvEscape(b.total),
        csvEscape(b.currency?.toUpperCase()),
        csvEscape(b.customer_name),
        csvEscape(b.customer_email),
        csvEscape(b.phone),
        csvEscape(b.id),
      ].join(','));
    }

    // Prefijo \uFEFF para que Excel detecte UTF-8 correctamente
    const csvContent = `\uFEFF${lines.join('\n')}`;
    const filename = `kce_reservas_${new Date().toISOString().slice(0,10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...withRequestId(undefined, requestId),
      },
    });

  } catch (err: any) {
    void logEvent('api.error', { route: '/api/admin/bookings/export', message: err.message, requestId }, { source: 'api' });
    return NextResponse.json({ error: 'Error al generar reporte', requestId }, { status: 500 });
  }
}