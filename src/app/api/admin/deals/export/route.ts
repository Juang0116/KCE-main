// src/app/api/admin/deals/export/route.ts
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
  stage: z.string().max(40).optional(),
  q: z.string().optional(),
  updated_from: Ymd.optional(),
  updated_to: Ymd.optional(),
  tour_slug: z.string().max(200).optional(),
  lead_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(2000),
});

type DealRow = {
  id: string;
  lead_id: string | null;
  customer_id: string | null;
  tour_slug: string | null;
  title: string | null;
  stage: string | null;
  amount_minor: number | null;
  currency: string | null;
  probability: number | null;
  assigned_to: string | null;
  source: string | null;
  notes?: string | null;
  created_at: string | null;
  updated_at: string | null;
  closed_at: string | null;
};

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

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[\n\r,\"]/g.test(s)) return `"${s.replace(/\"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const rl = await checkRateLimit(req, {
    action: 'admin.export.deals',
    limit: 10,
    windowSeconds: 60,
    identity: 'ip+vid',
    failOpen: true,
  });

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many export requests', code: 'RATE_LIMIT', retryAfterSeconds: rl.retryAfterSeconds ?? 60, requestId },
      { status: 429, headers: withRequestId({ 'Retry-After': String(rl.retryAfterSeconds ?? 60) }, requestId) },
    );
  }

  try {
    const url = new URL(req.url);

    const parsed = QuerySchema.safeParse({
      stage: url.searchParams.get('stage') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      updated_from:
        url.searchParams.get('from') ?? url.searchParams.get('updated_from') ?? undefined,
      updated_to: url.searchParams.get('to') ?? url.searchParams.get('updated_to') ?? undefined,
      tour_slug: url.searchParams.get('tour') ?? url.searchParams.get('tour_slug') ?? undefined,
      lead_id: url.searchParams.get('lead_id') ?? undefined,
      customer_id: url.searchParams.get('customer_id') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const { stage, q, updated_from, updated_to, tour_slug, lead_id, customer_id, limit } =
      parsed.data;

    const admin = getSupabaseAdmin();

    // IMPORTANT: deals no está en tu Database types -> casteamos SOLO esta query.
    let query = (admin as any)
      .from('deals')
      .select(
        'id,lead_id,customer_id,tour_slug,title,stage,amount_minor,currency,probability,assigned_to,source,created_at,updated_at,closed_at',
      )
      .order('updated_at', { ascending: false })
      .limit(Math.max(1, Math.min(5000, limit)));


    if (stage) query = query.eq('stage', stage);
    if (tour_slug) query = query.eq('tour_slug', tour_slug);
    if (lead_id) query = query.eq('lead_id', lead_id);
    if (customer_id) query = query.eq('customer_id', customer_id);

    if (updated_from) query = query.gte('updated_at', ymdToIsoStart(updated_from));
    if (updated_to) query = query.lt('updated_at', ymdToIsoEndExclusive(updated_to));

    if (q?.trim()) {
      const qq = q.trim();
      // Nota: or() en PostgREST es string raw, así que escapamos comillas simples para evitar romper el filtro
      const safe = qq.replace(/'/g, "''");
      query = query.or(
        `title.ilike.%${safe}%,source.ilike.%${safe}%,tour_slug.ilike.%${safe}%,assigned_to.ilike.%${safe}%`,
      );
    }

    const res = await query;

    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/deals/export', message: res.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const rows = (res.data ?? []) as unknown as DealRow[];

    await logEvent(
      'admin.deals_exported',
      {
        request_id: requestId,
        count: rows.length,
        filters: {
          stage: stage ?? null,
          q: q ?? null,
          updated_from: updated_from ?? null,
          updated_to: updated_to ?? null,
          tour_slug: tour_slug ?? null,
          lead_id: lead_id ?? null,
          customer_id: customer_id ?? null,
        },
      },
      { source: 'admin' },
    );

    const header = [
      'updated_at',
      'created_at',
      'stage',
      'title',
      'tour_slug',
      'amount_minor',
      'currency',
      'probability',
      'assigned_to',
      'source',
      'lead_id',
      'customer_id',
      'closed_at',
      'deal_id',
    ].join(',');

    const lines = [header];

    for (const d of rows) {
      lines.push(
        [
          csvEscape(d.updated_at),
          csvEscape(d.created_at),
          csvEscape(d.stage),
          csvEscape(d.title),
          csvEscape(d.tour_slug),
          csvEscape(d.amount_minor),
          csvEscape((d.currency ?? 'EUR').toUpperCase()),
          csvEscape(d.probability),
          csvEscape(d.assigned_to),
          csvEscape(d.source),
          csvEscape(d.lead_id),
          csvEscape(d.customer_id),
          csvEscape(d.closed_at),
          csvEscape(d.id),
        ].join(','),
      );
    }

    const csv = `\uFEFF${lines.join('\n')}`; // BOM para Excel
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `deals_${ts}.csv`;

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
        route: '/api/admin/deals/export',
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
