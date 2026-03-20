// src/app/api/admin/metrics/cta-funnel/route.ts
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
  
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return `${ymd}T00:00:00.000Z`;
  }
  
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
  // 1. Autenticación y configuración
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 2. Validación de parámetros de fecha
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const now = new Date();
    const toYMD = parsed.data.to ?? now.toISOString().slice(0, 10);
    const fromYMD = parsed.data.from ?? new Date(now.getTime() - 29 * 86400000).toISOString().slice(0, 10);

    const fromIso = ymdToIsoStart(fromYMD);
    const toIso = ymdToIsoEndExclusive(toYMD);

    const db = admin as any; // Workaround temporal para tipos inestables

    // 3. Extracción masiva de eventos (Ventana límite de 50k para prevención de OOM)
    const { data, error: dbError } = await db
      .from('events')
      .select('type, payload, created_at')
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

    if (dbError) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/metrics/cta-funnel', message: dbError.message },
        { source: 'api' }
      );
      return NextResponse.json(
        { error: 'Error al cargar los eventos del embudo', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) }
      );
    }

    const rows: EventRow[] = Array.isArray(data) ? data : [];

    // Alerta preventiva si tocamos el techo de extracción
    if (rows.length >= 50000) {
      await logEvent(
        'metrics.fallback_truncated',
        { requestId, fromYMD, toYMD, eventCount: rows.length, aggregator: 'cta-funnel' },
        { source: 'system' }
      );
    }

    // 4. Procesamiento en memoria (Agrupación O(N))
    const clicks = new Map<string, number>();
    const checkoutSessionsByCta = new Map<string, Set<string>>();
    const paidSessionsByLast = new Map<string, Set<string>>();
    const paidSessionsByFirst = new Map<string, Set<string>>();
    const revenueByLast = new Map<string, number>();
    const revenueByFirst = new Map<string, number>();
    const pairs = new Map<string, { count: number; revenue_minor: number }>();

    for (const r of rows) {
      const p = r.payload || {};

      // Acumulador de Clicks
      if (r.type === 'ui.cta.click') {
        const cta = str(p.cta, 120);
        if (!cta) continue;
        clicks.set(cta, (clicks.get(cta) || 0) + 1);
        continue;
      }

      // Acumulador de Inicios de Checkout
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
        const key = cta;
        if (!checkoutSessionsByCta.has(key)) checkoutSessionsByCta.set(key, new Set());
        
        // Si no hay ID de sesión, usamos el timestamp como identificador fallback para evitar que colisionen
        checkoutSessionsByCta.get(key)!.add(sid || `no_session:${r.created_at}`);
        continue;
      }

      // Acumulador de Pagos y Atribución
      if (r.type === 'checkout.paid') {
        const lastCta = str(p.cta, 120);
        const firstCta = str(p.first_cta, 120);
        const sid = pickSessionId(p);
        const amount = typeof p.amount_total_minor === 'number' ? Math.trunc(p.amount_total_minor) : 0;
        const sessionFallback = sid || `no_session:${r.created_at}`;

        // Atribución de Último Toque (Last-Touch)
        if (lastCta) {
          if (!paidSessionsByLast.has(lastCta)) paidSessionsByLast.set(lastCta, new Set());
          const set = paidSessionsByLast.get(lastCta)!;
          if (!set.has(sessionFallback)) {
            set.add(sessionFallback);
            revenueByLast.set(lastCta, (revenueByLast.get(lastCta) || 0) + amount);
          }
        }

        // Atribución de Primer Toque (First-Touch)
        if (firstCta) {
          if (!paidSessionsByFirst.has(firstCta)) paidSessionsByFirst.set(firstCta, new Set());
          const set = paidSessionsByFirst.get(firstCta)!;
          if (!set.has(sessionFallback)) {
            set.add(sessionFallback);
            revenueByFirst.set(firstCta, (revenueByFirst.get(firstCta) || 0) + amount);
          }
        }

        // Matriz Multi-Táctil (First -> Last)
        if (firstCta && lastCta) {
          const k = `${firstCta}__${lastCta}`;
          const cur = pairs.get(k) || { count: 0, revenue_minor: 0 };
          cur.count += 1;
          cur.revenue_minor += amount;
          pairs.set(k, cur);
        }
      }
    }

    // 5. Transformación y Ordenamiento Final
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

    // 6. Motor de Recomendaciones Heurísticas
    const recommendations = lastItems
      .filter((r) => r.clicks >= 20) // Ruido estadístico mínimo
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
          note: kind === 'high_click_low_checkout'
              ? 'Mucho click pero pocos checkouts: revisar coherencia del CTA/UX, precio mostrado, fecha por defecto o tiempos de carga.'
              : 'Llega a checkout pero abandona antes de pagar: revisar fricciones en móvil, sellos de confianza, upsells agresivos o fallos en métodos de pago.'
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
      { headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al calcular el funnel de CTAs';
    
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/cta-funnel', message: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}