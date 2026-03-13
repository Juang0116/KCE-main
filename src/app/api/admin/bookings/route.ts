// src/app/api/admin/bookings/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
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
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

function ymdToIsoStart(ymd: string) {
  return `${ymd}T00:00:00.000Z`;
}

function ymdToIsoEndExclusive(ymd: string) {
  const [ys, ms, ds] = ymd.split('-');

  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);

  // Safety net (aunque tu Zod ya valida el formato)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return `${ymd}T00:00:00.000Z`;
  }

  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString();
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      status: url.searchParams.get('status') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      created_from:
        url.searchParams.get('from') ?? url.searchParams.get('created_from') ?? undefined,
      created_to: url.searchParams.get('to') ?? url.searchParams.get('created_to') ?? undefined,
      tour_slug: url.searchParams.get('tour') ?? url.searchParams.get('tour_slug') ?? undefined,
      tour_id: url.searchParams.get('tour_id') ?? undefined,
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const { status, q, created_from, created_to, tour_slug, tour_id, page, limit } = parsed.data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const admin = getSupabaseAdmin();
    let query = admin
      .from('bookings')
      .select(
        'id,status,stripe_session_id,total,currency,origin_currency,tour_price_minor,date,persons,customer_email,customer_name,phone,created_at,tour_id,tours(title,slug,city)',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (tour_id) query = query.eq('tour_id', tour_id);
    if (tour_slug) query = query.eq('tours.slug', tour_slug);

    if (created_from) query = query.gte('created_at', ymdToIsoStart(created_from));
    if (created_to) query = query.lt('created_at', ymdToIsoEndExclusive(created_to));

    if (q) {
      const qq = q.trim();
      if (qq) {
        // NOTE: OR filter across scalar columns is stable; embedded relation filtering is avoided.
        query = query.or(
          `customer_email.ilike.%${qq}%,customer_name.ilike.%${qq}%,stripe_session_id.ilike.%${qq}%`,
        );
      }
    }

    const res = await query;
    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/bookings', message: res.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    return NextResponse.json(
      { items: res.data ?? [], page, limit, total: res.count ?? null, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/bookings',
        message: e instanceof Error ? e.message : 'unknown',
      },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
