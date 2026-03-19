import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdminScope } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional().default(30),
}).strict();

type SpendRow = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  spend_minor: number;
};

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  // ✅ Estructura correcta para withRequestId
  return withRequestId(req, async () => {
    const auth = await requireAdminScope(req);
    if (!auth.ok) return auth.response;

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin DB no configurada', requestId }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const q = QuerySchema.parse({ days: searchParams.get('days') ?? undefined });
    const since = new Date(Date.now() - q.days * 24 * 60 * 60 * 1000).toISOString();

    // 1. Obtener Gastos de Marketing
    const spendRes = await (admin as any)
      .from('marketing_spend_daily')
      .select('source, medium, campaign, spend_minor')
      .gte('day', since.slice(0, 10))
      .limit(5000);

    // Manejo resiliente si la tabla no existe aún
    const isTableMissing = spendRes.error && /relation .*marketing_spend_daily/i.test(spendRes.error.message);
    const spendData: SpendRow[] = (spendRes.error && !isTableMissing) ? [] : (spendRes.data ?? []);

    // 2. Obtener Ingresos desde Eventos (Stripe Paid)
    const evRes = await (admin as any)
      .from('events')
      .select('payload, created_at')
      .eq('type', 'checkout.paid')
      .gte('created_at', since)
      .limit(5000);

    if (evRes.error) {
      return NextResponse.json({ ok: false, error: evRes.error.message, requestId }, { status: 500 });
    }

    // 3. Procesamiento de Datos
    const spendBy: Record<string, number> = {};
    const revenueBy: Record<string, { revenue: number; count: number }> = {};
    let totalSpend = 0;
    let totalRevenue = 0;
    let totalPaidCount = 0;

    // Agrupar Gastos
    for (const r of spendData) {
      const src = (r.source || 'unknown').toLowerCase();
      const amt = Number(r.spend_minor || 0);
      spendBy[src] = (spendBy[src] || 0) + amt;
      totalSpend += amt;
    }

    // Agrupar Ingresos por UTMs
    const events = (evRes.data as any[]) ?? [];
    for (const e of events) {
      const p = e?.payload || {};
      const src = (p.utm_source || p.source || 'direct/organic').toLowerCase();
      const amt = Number(p.amount_total_minor || 0);

      totalRevenue += amt;
      totalPaidCount += 1;

      if (!revenueBy[src]) revenueBy[src] = { revenue: 0, count: 0 };
      revenueBy[src].revenue += amt;
      revenueBy[src].count += 1;
    }

    // 4. Calcular KPIs por Canal
    const allChannels = Array.from(new Set([...Object.keys(spendBy), ...Object.keys(revenueBy)])).sort();

    const rows = allChannels.map((channel) => {
      const spend = spendBy[channel] || 0;
      const revenue = revenueBy[channel]?.revenue || 0;
      const sales = revenueBy[channel]?.count || 0;
      
      return {
        channel,
        spend_minor: spend,
        revenue_minor: revenue,
        sales,
        cac_minor: sales > 0 ? Math.round(spend / sales) : 0,
        roas: spend > 0 ? Number((revenue / spend).toFixed(2)) : null,
      };
    });

    const summary = {
      total_spend_minor: totalSpend,
      total_revenue_minor: totalRevenue,
      total_sales: totalPaidCount,
      total_roas: totalSpend > 0 ? Number((totalRevenue / totalSpend).toFixed(2)) : null,
      days_period: q.days
    };

    return NextResponse.json({ 
      ok: true, 
      rows, 
      summary, 
      requestId,
      notice: isTableMissing ? 'Usando gasto 0 (tabla marketing_spend_daily ausente)' : undefined
    });
  });
}