// src/app/api/admin/metrics/utm/by-tour/route.ts
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
  utm_key: z.string().trim().min(3, "Se requiere un utm_key válido"),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

const TRACKED_TYPES = ['tour.view', 'checkout.started', 'checkout.paid'] as const;

function toIsoStart(dateStr: string) {
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

function toIsoEndExclusive(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

function pickUtmKey(payload: any): string {
  const p = payload ?? {};
  const src = String(p.utm_source || p.utm?.utm_source || (p.utm_key ? String(p.utm_key).split('/')[0] : '') || 'direct');
  const med = String(p.utm_medium || p.utm?.utm_medium || (p.utm_key ? String(p.utm_key).split('/')[1] : '') || 'none');
  const camp = String(p.utm_campaign || p.utm?.utm_campaign || (p.utm_key ? String(p.utm_key).split('/')[2] : '') || 'na');
  return `${src}/${med}/${camp}`;
}

function pickTourSlug(payload: any): string {
  const p = payload ?? {};
  const slug = p.tour_slug || p.slug || p.meta?.tour_slug || p.meta?.slug || p.tour?.slug || '';
  return String(slug).trim();
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Cliente Supabase no configurado', requestId },
      { status: 503, headers: withRequestId(new Headers(), requestId) }
    );
  }

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      utm_key: url.searchParams.get('utm_key') ?? undefined,
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Parámetros inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(new Headers(), requestId) }
      );
    }

    const { utm_key: targetUtmKey, limit, from: fromParam, to: toParam } = parsed.data;
    
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastWeekStr = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const fromYMD = fromParam ?? lastWeekStr;
    const toYMD = toParam ?? todayStr;

    const db = admin as any;

    const { data: events, error: dbError } = await db
      .from('events')
      .select('type, payload')
      .in('type', [...TRACKED_TYPES])
      .gte('created_at', toIsoStart(fromYMD))
      .lt('created_at', toIsoEndExclusive(toYMD))
      .limit(15000);

    if (dbError) {
      throw new Error(`DB Error: ${dbError.message}`);
    }

    const rows = (events ?? []);
    
    if (rows.length >= 15000) {
      await logEvent(
        'metrics.fallback_truncated',
        { requestId, aggregator: 'utm-by-tour', utm_key: targetUtmKey },
        { source: 'system' }
      );
    }

    const agg: Record<string, { views: number; started: number; paid: number }> = {};

    for (const e of rows) {
      if (pickUtmKey(e.payload) !== targetUtmKey) continue;

      const slug = pickTourSlug(e.payload);
      if (!slug) continue;

      const cur = agg[slug] ?? { views: 0, started: 0, paid: 0 };
      if (e.type === 'tour.view') cur.views++;
      if (e.type === 'checkout.started') cur.started++;
      if (e.type === 'checkout.paid') cur.paid++;
      agg[slug] = cur;
    }

    const slugs = Object.keys(agg);

    let tourMetadata: Record<string, { title: string; city: string }> = {};
    if (slugs.length > 0) {
      const { data: tours } = await db
        .from('tours')
        .select('slug, title, city')
        .in('slug', slugs.slice(0, 500));

      if (tours) {
        tourMetadata = Object.fromEntries(
          tours.map((t: any) => [t.slug, { title: t.title || '—', city: t.city || '—' }])
        );
      }
    }

    const items = slugs
      .map((slug) => {
        // CORRECCIÓN: Definimos un objeto por defecto para evitar errores de 'undefined'
        const stats = agg[slug] ?? { views: 0, started: 0, paid: 0 };
        const meta = tourMetadata[slug] ?? { title: 'Tour eliminado o privado', city: '—' };

        return {
          tour_slug: slug,
          tour_title: meta.title,
          city: meta.city,
          tour_views: stats.views,
          checkout_started: stats.started,
          checkout_paid: stats.paid,
          rates: {
            startPerView: stats.views > 0 ? stats.started / stats.views : 0,
            paidPerStart: stats.started > 0 ? stats.paid / stats.started : 0,
            paidPerView: stats.views > 0 ? stats.paid / stats.views : 0,
          },
        };
      })
      .sort((a, b) => 
        (b.checkout_paid - a.checkout_paid) || 
        (b.checkout_started - a.checkout_started) || 
        (b.tour_views - a.tour_views)
      )
      .slice(0, limit);

    return NextResponse.json(
      { 
        ok: true, 
        requestId, 
        window: { from: fromYMD, to: toYMD }, 
        utm_key: targetUtmKey, 
        items,
        count_truncated: rows.length >= 15000
      },
      { headers: withRequestId(new Headers(), requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido en analítica UTM';

    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/utm/by-tour', message: errorMessage },
      { source: 'api' }
    );

    return NextResponse.json(
      { ok: false, requestId, error: 'Fallo al procesar métricas de UTM por tour' },
      { status: 500, headers: withRequestId(new Headers(), requestId) }
    );
  }
}