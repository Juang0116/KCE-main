import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminCapability } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const auth = await requireAdminCapability(req, 'metrics_view');
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const days = Math.min(30, Math.max(1, Number(url.searchParams.get('days') || '1')));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    // NOTE: En algunos despliegues los tipos generados de Supabase pueden no
    // incluir todavía tablas nuevas (p.ej. crm_alerts / crm_mitigation_actions).
    // Para no romper `next build` por typing, hacemos un cast puntual mientras
    // se regeneran/alinean los tipos Database.
    const admin = getSupabaseAdmin() as any;

    const [alertsRes, mitigRes, paidRes] = await Promise.all([
      admin
        .from('crm_alerts')
        .select('type,severity,created_at')
        .gte('created_at', since),
      admin
        .from('crm_mitigation_actions')
        .select('action,created_at')
        .gte('created_at', since),
      admin
        .from('events')
        .select('type,payload,created_at')
        .eq('type', 'checkout.paid')
        .gte('created_at', since),
    ]);

    const alerts = alertsRes.data || [];
    const mitigations = mitigRes.data || [];
    const paid = paidRes.data || [];

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    for (const a of alerts as any[]) {
      byType[a.type] = (byType[a.type] || 0) + 1;
      bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
    }

    const mitByAction: Record<string, number> = {};
    for (const m of mitigations as any[]) mitByAction[m.action] = (mitByAction[m.action] || 0) + 1;

    let revenueMinor = 0;
    let currency = 'EUR';
    for (const e of paid as any[]) {
      const p = (e.payload || {}) as any;
      if (typeof p.amount_total_minor === 'number') revenueMinor += p.amount_total_minor;
      if (p.currency) currency = String(p.currency).toUpperCase();
    }

    return NextResponse.json(
      {
        ok: true,
        requestId,
        windowDays: days,
        since,
        alerts: { total: alerts.length, byType, bySeverity },
        mitigations: { total: mitigations.length, byAction: mitByAction },
        paid: { total: paid.length, revenueMinor, currency },
      },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e), requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
