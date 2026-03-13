// src/app/api/admin/bookings/export/route.ts
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

function ymdToIsoStart(ymd: string) {
  return `${ymd}T00:00:00.000Z`;
}

function ymdToIsoEndExclusive(ymd: string) {
  const [ys, ms, ds] = ymd.split('-');

  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);

  // Safety net (aunque Ymd ya valida el formato)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return `${ymd}T00:00:00.000Z`;
  }

  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString();
}

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[\n\r,\"]/g.test(s)) {
    return `"${s.replace(/\"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const rl = await checkRateLimit(req, {
    action: 'admin.export.bookings',
    limit: 10,
    windowSeconds: 60,
    identity: 'ip+vid',
    failOpen: true,
  });

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many export requests', code: 'RATE_LIMIT', retryAfterSeconds: rl.retryAfterSeconds ?? 60, requestId },
      {
        status: 429,
        headers: withRequestId({ 'Retry-After': String(rl.retryAfterSeconds ?? 60) }, requestId),
      },
    );
  }

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
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const { status, q, created_from, created_to, tour_slug, tour_id, limit } = parsed.data;

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: 'Supabase admin not configured', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    let query: any = (admin as any)
      .from('bookings')
      .select(
        'id,status,stripe_session_id,total,currency,origin_currency,date,persons,customer_email,customer_name,phone,created_at,tours(title,slug,city)',
      )
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(5000, limit)));


    if (status) query = query.eq('status', status);
    if (tour_id) query = query.eq('tour_id', tour_id);
    if (tour_slug) query = query.eq('tours.slug', tour_slug);

    if (created_from) query = query.gte('created_at', ymdToIsoStart(created_from));
    if (created_to) query = query.lt('created_at', ymdToIsoEndExclusive(created_to));

    if (q) {
      const qq = q.trim();
      if (qq) {
        query = query.or(
          `customer_email.ilike.%${qq}%,customer_name.ilike.%${qq}%,stripe_session_id.ilike.%${qq}%`,
        );
      }
    }

    const res = await query;
    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/bookings/export', message: res.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const rows = res.data ?? [];

    await logEvent(
      'admin.bookings_exported',
      {
        request_id: requestId,
        count: rows.length,
        filters: {
          status: status ?? null,
          q: q ?? null,
          created_from: created_from ?? null,
          created_to: created_to ?? null,
          tour_slug: tour_slug ?? null,
          tour_id: tour_id ?? null,
        },
      },
      { source: 'admin' },
    );

    const header = [
      'created_at',
      'status',
      'stripe_session_id',
      'tour_title',
      'tour_slug',
      'tour_city',
      'date',
      'persons',
      'total_minor',
      'currency',
      'customer_name',
      'customer_email',
      'phone',
      'booking_id',
    ].join(',');

    const lines = [header];
    for (const b of rows as any[]) {
      const tour = b.tours ?? null;
      lines.push(
        [
          csvEscape(b.created_at),
          csvEscape(b.status),
          csvEscape(b.stripe_session_id),
          csvEscape(tour?.title ?? ''),
          csvEscape(tour?.slug ?? ''),
          csvEscape(tour?.city ?? ''),
          csvEscape(b.date),
          csvEscape(b.persons),
          csvEscape(b.total ?? ''),
          csvEscape((b.currency ?? 'EUR').toUpperCase()),
          csvEscape(b.customer_name ?? ''),
          csvEscape(b.customer_email ?? ''),
          csvEscape(b.phone ?? ''),
          csvEscape(b.id),
        ].join(','),
      );
    }

    const csv = `\uFEFF${lines.join('\n')}`; // BOM para Excel
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `bookings_${ts}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${filename}"`,
        ...withRequestId(undefined, requestId),
      },
    });
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/bookings/export',
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
