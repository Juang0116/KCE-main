// src/app/api/admin/metrics/cta-performance/route.ts
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
  type: string;
  payload: any;
  created_at: string;
};

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

    // NOTE: limit is best-effort; we keep it conservative for admin dashboards.
    const { data, error } = await (admin as any)
      .from('events')
      .select('type,payload,created_at')
      .in('type', ['ui.page.view', 'ui.block.view', 'ui.cta.click'])
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

    const pageViews = new Map<string, number>();
    const blockViews = new Map<string, number>();
    const ctaClicks = new Map<string, number>();

    for (const r of rows) {
      const payload = r.payload || {};
      const page = typeof payload.page === 'string' ? payload.page : '';

      if (r.type === 'ui.page.view') {
        if (!page) continue;
        pageViews.set(page, (pageViews.get(page) || 0) + 1);
      } else if (r.type === 'ui.block.view') {
        const block = typeof payload.block === 'string' ? payload.block : '';
        if (!page || !block) continue;
        const k = `${page}__${block}`;
        blockViews.set(k, (blockViews.get(k) || 0) + 1);
      } else if (r.type === 'ui.cta.click') {
        const cta = typeof payload.cta === 'string' ? payload.cta : '';
        if (!page || !cta) continue;
        const k = `${page}__${cta}`;
        ctaClicks.set(k, (ctaClicks.get(k) || 0) + 1);
      }
    }

    const pages = Array.from(pageViews.entries())
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, parsed.data.limit);

    const blocks = Array.from(blockViews.entries())
      .map(([k, views]) => {
        const [page = '', block = ''] = k.split('__'); // ✅ defaults => string (no undefined)
        return { page, block, views };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, parsed.data.limit);

    const ctas = Array.from(ctaClicks.entries())
      .map(([k, clicks]) => {
        const [page = '', cta = ''] = k.split('__'); // ✅ defaults => string (no undefined)
        const pv = pageViews.get(page) || 0;
        const click_rate = pv > 0 ? Number((clicks / pv).toFixed(4)) : null;
        return { page, cta, clicks, click_rate };
      })
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, parsed.data.limit);

    return NextResponse.json(
      {
        ok: true,
        window: { from: fromYMD, to: toYMD },
        counts: {
          events: rows.length,
          pages: pageViews.size,
          blocks: blockViews.size,
          ctas: ctaClicks.size,
        },
        pages,
        blocks,
        ctas,
        requestId,
      },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Internal error', details: String(e?.message || e), requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
