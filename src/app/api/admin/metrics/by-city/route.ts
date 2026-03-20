// src/app/api/admin/metrics/by-city/route.ts
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
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

function ymdToIsoStart(ymd: string) {
  return `${ymd}T00:00:00.000Z`;
}

function ymdToIsoEndExclusive(ymd: string) {
  const [ys, ms, ds] = ymd.split('-');

  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);

  // Red de seguridad en caso de fallo de parsing
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return `${ymd}T00:00:00.000Z`;
  }

  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString();
}

type Row = {
  city: string;
  tour_views: number;
  checkout_started: number;
  checkout_paid: number;
};

export async function GET(req: NextRequest) {
  // 1. Autenticación
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
    // 2. Parseo y validación de parámetros de fecha
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

    const db = admin as any; // Workaround temporal para tipos "never" o falta de RPC en la firma

    // 3. Intento Principal: Consulta vía RPC (SQL)
    const rpc = await db.rpc('metrics_by_city', { p_from: fromIso, p_to: toIso });

    if (!rpc.error && Array.isArray(rpc.data)) {
      const items: Row[] = (rpc.data as any[])
        .map((r) => ({
          city: String(r.city || '—'),
          tour_views: Number(r.tour_views || 0),
          checkout_started: Number(r.checkout_started || 0),
          checkout_paid: Number(r.checkout_paid || 0),
        }))
        .slice(0, parsed.data.limit);

      return NextResponse.json(
        { window: { from: fromYMD, to: toYMD }, items, requestId, truncated: false },
        { status: 200, headers: withRequestId(undefined, requestId) }
      );
    }

    // 4. Fallback: Agregación en Node (Best-Effort) - Límite de 10k eventos
    const evRes = await db
      .from('events')
      .select('type, payload, created_at')
      .in('type', ['tour.view', 'checkout.started', 'checkout.paid'])
      .gte('created_at', fromIso)
      .lt('created_at', toIso)
      .order('created_at', { ascending: false })
      .range(0, 9999);

    if (evRes.error) {
      throw new Error(`Fallback DB Error: ${evRes.error.message}`);
    }

    const aggBySlug = new Map<string, { views: number; started: number; paid: number }>();

    const pickSlug = (_type: string, payload: any): string => {
      if (!payload) return '';
      const direct = payload.tour_slug || payload.slug || payload.tour;
      if (typeof direct === 'string' && direct) return direct;
      
      const meta = payload.meta || payload.metadata;
      const fromMeta = meta?.tour_slug || meta?.slug || meta?.tour;
      if (typeof fromMeta === 'string' && fromMeta) return fromMeta;
      
      return '';
    };

    // Agrupamos métricas por slug del tour
    for (const e of evRes.data as any[]) {
      const slug = pickSlug(e.type, e.payload);
      if (!slug) continue;
      
      const cur = aggBySlug.get(slug) ?? { views: 0, started: 0, paid: 0 };
      if (e.type === 'tour.view') cur.views += 1;
      if (e.type === 'checkout.started') cur.started += 1;
      if (e.type === 'checkout.paid') cur.paid += 1;
      
      aggBySlug.set(slug, cur);
    }

    const slugs = Array.from(aggBySlug.keys());

    // Cruzamos slugs con la tabla de tours para obtener las ciudades
    const tourRes = slugs.length > 0
      ? await db.from('tours').select('slug, city').in('slug', slugs)
      : { data: [], error: null };

    const slugToCity = new Map<string, string>();
    if (!tourRes.error && Array.isArray(tourRes.data)) {
      for (const t of tourRes.data as any[]) {
        if (t.slug) slugToCity.set(String(t.slug), String(t.city || '—'));
      }
    }

    // Consolidamos las métricas finales por ciudad
    const aggByCity = new Map<string, { views: number; started: number; paid: number }>();
    for (const [slug, metrics] of aggBySlug.entries()) {
      const city = slugToCity.get(slug) ?? '—';
      const cur = aggByCity.get(city) ?? { views: 0, started: 0, paid: 0 };
      
      cur.views += metrics.views;
      cur.started += metrics.started;
      cur.paid += metrics.paid;
      
      aggByCity.set(city, cur);
    }

    // Ordenamos y formateamos el resultado
    const items: Row[] = Array.from(aggByCity.entries())
      .map(([city, v]) => ({
        city,
        tour_views: v.views,
        checkout_started: v.started,
        checkout_paid: v.paid,
      }))
      .sort((a, b) => 
        (b.checkout_paid - a.checkout_paid) || 
        (b.checkout_started - a.checkout_started) || 
        (b.tour_views - a.tour_views)
      )
      .slice(0, parsed.data.limit);

    const isTruncated = (evRes.data?.length ?? 0) >= 10000;

    // Si hubo truncamiento en el fallback, lo logueamos como advertencia de Ops
    if (isTruncated) {
      await logEvent(
        'metrics.fallback_truncated',
        { requestId, fromYMD, toYMD, eventCount: evRes.data.length },
        { source: 'system' }
      );
    }

    return NextResponse.json(
      {
        window: { from: fromYMD, to: toYMD },
        items,
        requestId,
        truncated: isTruncated,
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar métricas';

    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/by-city', message: errorMessage },
      { source: 'api' }
    );

    return NextResponse.json(
      { error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}