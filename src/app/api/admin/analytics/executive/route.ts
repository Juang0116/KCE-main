import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z
  .object({
    days: z.coerce.number().int().min(1).max(365).optional().default(30),
  })
  .strict();

type SpendRow = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  spend_minor: number;
};

export async function GET(req: NextRequest) {
  // ✅ Correct usage: withRequestId(req, handler)
  return withRequestId(req, async () => {
    const requestId = getRequestId(req.headers);

    await requireAdminScope(req);

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: 'Supabase admin not configured', requestId },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(req.url);
    const q = QuerySchema.parse({ days: searchParams.get('days') ?? undefined });

    const since = new Date(Date.now() - q.days * 24 * 60 * 60 * 1000).toISOString();

    // Spend grouped by source (fallback unknown)
    const spendRes = await (admin as any)
      .from('marketing_spend_daily')
      .select('source, medium, campaign, spend_minor')
      .gte('day', since.slice(0, 10))
      .limit(5000);

    const spendData: SpendRow[] = spendRes.error ? [] : ((spendRes.data as SpendRow[] | null) ?? []);

    // If marketing_spend_daily is not installed yet, treat as 0 spend.
    if (spendRes.error && !/relation .*marketing_spend_daily/i.test(spendRes.error.message)) {
      return NextResponse.json(
        { ok: false, error: spendRes.error.message, requestId },
        { status: 500 },
      );
    }

    // Revenue from events checkout.paid (expects amount_total_minor + utm_source)
    const evRes = await (admin as any)
      .from('events')
      .select('payload, created_at')
      .eq('type', 'checkout.paid')
      .gte('created_at', since)
      .limit(5000);

    if (evRes.error) {
      return NextResponse.json(
        { ok: false, error: evRes.error.message, requestId },
        { status: 500 },
      );
    }

    const spendBy: Record<string, number> = {};
    let totalSpend = 0;

    for (const r of spendData) {
      const k = (r.source || 'unknown') as string;
      const amt = Number((r as any).spend_minor || 0);
      spendBy[k] = (spendBy[k] || 0) + amt;
      totalSpend += amt;
    }

    const revenueBy: Record<string, { revenue: number; paid: number }> = {};
    let totalRevenue = 0;
    let totalPaid = 0;

    for (const e of ((evRes.data as any[]) ?? [])) {
      const p = e?.payload || {};
      const src = (p.utm_source || p.source || 'unknown') as string;
      const amt = Number(p.amount_total_minor || 0);

      totalRevenue += amt;
      totalPaid += 1;

      if (!revenueBy[src]) revenueBy[src] = { revenue: 0, paid: 0 };
      revenueBy[src].revenue += amt;
      revenueBy[src].paid += 1;
    }

    const keys = Array.from(new Set([...Object.keys(spendBy), ...Object.keys(revenueBy)])).sort();

    const rows = keys.map((k) => {
      const spend = spendBy[k] || 0;
      const rev = revenueBy[k]?.revenue || 0;
      const paid = revenueBy[k]?.paid || 0;
      const cac = paid > 0 ? Math.round(spend / paid) : null;
      const roas = spend > 0 ? Number((rev / spend).toFixed(3)) : null;
      return { k, spend_minor: spend, revenue_minor: rev, paid, cac_minor: cac, roas };
    });

    const summary = {
      spend_minor: totalSpend,
      revenue_minor: totalRevenue,
      paid: totalPaid,
      roas: totalSpend > 0 ? Number((totalRevenue / totalSpend).toFixed(3)) : null,
    };

    return NextResponse.json({ ok: true, rows, summary, requestId }, { status: 200 });
  });
}
