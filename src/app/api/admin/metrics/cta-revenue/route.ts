// src/app/api/admin/metrics/cta-revenue/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
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
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return `${ymd}T00:00:00.000Z`;
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
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const now = new Date();
    const toYMD = parsed.data.to ?? now.toISOString().slice(0, 10);
    const fromYMD =
      parsed.data.from ?? new Date(now.getTime() - 29 * 86400000).toISOString().slice(0, 10);

    const fromIso = ymdToIsoStart(fromYMD);
    const toIso = ymdToIsoEndExclusive(toYMD);

    const admin = getSupabaseAdmin();

    const { data, error } = await (admin as any)
      .from('events')
      .select('payload,created_at')
      .eq('type', 'checkout.paid')
      .gte('created_at', fromIso)
      .lt('created_at', toIso)
      .order('created_at', { ascending: false })
      .limit(20000);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to load events', details: String(error.message || error), requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const rows: EventRow[] = Array.isArray(data) ? data : [];

    const byCta = new Map<
      string,
      { cta: string; paid: number; revenue_minor: number; currency: string; last: string }
    >();

    for (const r of rows) {
      const p = r.payload || {};
      const cta = safeStr(p.cta, 120) || 'unknown';
      const currency = safeStr(p.currency, 6) || 'EUR';
      const amt = safeInt(p.amount_total_minor);

      const k = `${cta}__${currency}`;
      const prev = byCta.get(k);
      if (!prev) {
        byCta.set(k, { cta, paid: 1, revenue_minor: amt, currency, last: r.created_at });
      } else {
        prev.paid += 1;
        prev.revenue_minor += amt;
        if (r.created_at > prev.last) prev.last = r.created_at;
      }
    }

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
      { headers: withRequestId(undefined, requestId) },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Internal error', details: String(e?.message || e), requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
