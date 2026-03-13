// src/app/api/admin/metrics/cta-funnel/route.ts
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

function str(v: any, max = 160): string {
  const s = typeof v === 'string' ? v : String(v ?? '');
  return s.trim().slice(0, max);
}

function pickSessionId(p: any): string {
  return str(p?.stripe_session_id || p?.session_id || p?.stripeSessionId || '', 200);
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
    const fromYMD = parsed.data.from ?? new Date(now.getTime() - 29 * 86400000).toISOString().slice(0, 10);

    const fromIso = ymdToIsoStart(fromYMD);
    const toIso = ymdToIsoEndExclusive(toYMD);

    const admin = getSupabaseAdmin();

    // We fetch a generous window of events and aggregate in-memory.
    const { data, error } = await (admin as any)
      .from('events')
      .select('type,payload,created_at')
      .in('type', [
        'ui.cta.click',
        'checkout.started',
        'checkout.session_created',
        'checkout.checkout_link_issued',
        'checkout.paid',
        'bot.checkout_session_created',
        'bot.checkout_started',
      ])
      .gte('created_at', fromIso)
      .lt('created_at', toIso)
      .order('created_at', { ascending: false })
      .limit(50000);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to load events', details: String(error.message || error), requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const rows: EventRow[] = Array.isArray(data) ? data : [];

    const clicks = new Map<string, number>();

    // Unique checkout sessions by (cta) and by (cta+first_cta)
    const checkoutSessionsByCta = new Map<string, Set<string>>();

    const paidSessionsByLast = new Map<string, Set<string>>();
    const paidSessionsByFirst = new Map<string, Set<string>>();

    const revenueByLast = new Map<string, number>();
    const revenueByFirst = new Map<string, number>();

    // Multi-touch matrix (first -> last)
    const pairs = new Map<string, { count: number; revenue_minor: number }>();

    for (const r of rows) {
      const p = r.payload || {};

      if (r.type === 'ui.cta.click') {
        const cta = str(p.cta, 120);
        if (!cta) continue;
        clicks.set(cta, (clicks.get(cta) || 0) + 1);
        continue;
      }

      if (
        r.type === 'checkout.checkout_link_issued' ||
        r.type === 'checkout.session_created' ||
        r.type === 'checkout.started' ||
        r.type === 'bot.checkout_session_created' ||
        r.type === 'bot.checkout_started'
      ) {
        const cta = str(p.cta, 120);
        if (!cta) continue;

        const sid = pickSessionId(p);
        // Some events do not have a session id (e.g. checkout.started). We still count them,
        // but they won't dedupe.
        const key = cta;
        if (!checkoutSessionsByCta.has(key)) checkoutSessionsByCta.set(key, new Set());
        checkoutSessionsByCta.get(key)!.add(sid || `no_session:${r.created_at}`);
        continue;
      }

      if (r.type === 'checkout.paid') {
        const lastCta = str(p.cta, 120);
        const firstCta = str(p.first_cta, 120);
        const sid = pickSessionId(p);

        const amount = typeof p.amount_total_minor === 'number' ? Math.trunc(p.amount_total_minor) : 0;

        if (lastCta) {
          if (!paidSessionsByLast.has(lastCta)) paidSessionsByLast.set(lastCta, new Set());
          const set = paidSessionsByLast.get(lastCta)!;
          if (!set.has(sid || `no_session:${r.created_at}`)) {
            set.add(sid || `no_session:${r.created_at}`);
            revenueByLast.set(lastCta, (revenueByLast.get(lastCta) || 0) + amount);
          }
        }

        if (firstCta) {
          if (!paidSessionsByFirst.has(firstCta)) paidSessionsByFirst.set(firstCta, new Set());
          const set = paidSessionsByFirst.get(firstCta)!;
          if (!set.has(sid || `no_session:${r.created_at}`)) {
            set.add(sid || `no_session:${r.created_at}`);
            revenueByFirst.set(firstCta, (revenueByFirst.get(firstCta) || 0) + amount);
          }
        }

        if (firstCta && lastCta) {
          const k = `${firstCta}__${lastCta}`;
          const cur = pairs.get(k) || { count: 0, revenue_minor: 0 };
          cur.count += 1;
          cur.revenue_minor += amount;
          pairs.set(k, cur);
        }
      }
    }

    const lastItems = Array.from(new Set([...clicks.keys(), ...checkoutSessionsByCta.keys(), ...paidSessionsByLast.keys()]))
      .map((cta) => {
        const c = clicks.get(cta) || 0;
        const checkouts = checkoutSessionsByCta.get(cta)?.size || 0;
        const paid = paidSessionsByLast.get(cta)?.size || 0;
        const revenue_minor = revenueByLast.get(cta) || 0;
        return {
          cta,
          clicks: c,
          checkouts,
          paid,
          revenue_minor,
          rates: {
            checkout_per_click: c ? checkouts / c : 0,
            paid_per_checkout: checkouts ? paid / checkouts : 0,
            paid_per_click: c ? paid / c : 0,
          },
        };
      })
      .sort((a, b) => (b.paid - a.paid) || (b.revenue_minor - a.revenue_minor) || (b.checkouts - a.checkouts));

    const firstItems = Array.from(paidSessionsByFirst.entries())
      .map(([cta, set]) => ({
        cta,
        paid: set.size,
        revenue_minor: revenueByFirst.get(cta) || 0,
      }))
      .sort((a, b) => (b.paid - a.paid) || (b.revenue_minor - a.revenue_minor));

    const pairItems = Array.from(pairs.entries())
      .map(([k, v]) => {
        const [first_cta, last_cta] = k.split('__');
        return { first_cta, last_cta, paid: v.count, revenue_minor: v.revenue_minor };
      })
      .sort((a, b) => (b.paid - a.paid) || (b.revenue_minor - a.revenue_minor))
      .slice(0, 200);

    // Simple heuristic recommendations (drop-off by CTA)
    const recommendations = lastItems
      .filter((r) => r.clicks >= 20)
      .map((r) => {
        const clickToCheckout = r.rates.checkout_per_click;
        const checkoutToPaid = r.rates.paid_per_checkout;

        let kind: 'high_click_low_checkout' | 'high_checkout_low_paid' | null = null;
        if (clickToCheckout < 0.12) kind = 'high_click_low_checkout';
        else if (checkoutToPaid < 0.12) kind = 'high_checkout_low_paid';
        if (!kind) return null;

        return {
          kind,
          cta: r.cta,
          clicks: r.clicks,
          checkouts: r.checkouts,
          paid: r.paid,
          note:
            kind === 'high_click_low_checkout'
              ? 'Mucho click pero pocos checkouts: revisar CTA/UX, precio, fecha por defecto, errores de checkout, velocidad.'
              : 'Llega a checkout pero no paga: revisar fricciones (móvil), confianza, copy, políticas, upsells, métodos de pago.'
        };
      })
      .filter(Boolean)
      .slice(0, 25);

    return NextResponse.json(
      {
        ok: true,
        window: { from: fromYMD, to: toYMD },
        currency: 'EUR',
        last_touch: {
          items: lastItems.slice(0, parsed.data.limit),
        },
        first_touch: {
          items: firstItems.slice(0, parsed.data.limit),
        },
        pairs: pairItems,
        recommendations,
        counts: {
          events: rows.length,
          unique_ctas: new Set(lastItems.map((x) => x.cta)).size,
        },
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
