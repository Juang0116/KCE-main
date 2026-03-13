// src/app/api/admin/metrics/funnel/route.ts
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
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

function ymdToIsoStart(ymd: string) {
  return `${ymd}T00:00:00.000Z`;
}

function ymdToIsoEndExclusive(ymd: string) {
  // exclusive end: next day start
  const [ys, ms, ds] = ymd.split('-');

  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);

  // Safety net (aunque el schema valide el formato)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return `${ymd}T00:00:00.000Z`;
  }

  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString();
}

async function countEvents(type: string, fromIso: string, toIso: string) {
  const admin = getSupabaseAdmin();
  const q = admin
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('type', type)
    .gte('created_at', fromIso)
    .lt('created_at', toIso);

  const res = await q;
  if (res.error) throw new Error(res.error.message);
  return res.count ?? 0;
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
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    // default: last 30 days
    const now = new Date();
    const toYMD = parsed.data.to ?? now.toISOString().slice(0, 10);

    const fromDate = new Date(
      Date.UTC(
        Number(toYMD.slice(0, 4)),
        Number(toYMD.slice(5, 7)) - 1,
        Number(toYMD.slice(8, 10)),
      ),
    );
    fromDate.setUTCDate(fromDate.getUTCDate() - 30);
    const fromYMD = parsed.data.from ?? fromDate.toISOString().slice(0, 10);

    const fromIso = ymdToIsoStart(fromYMD);
    const toIso = ymdToIsoEndExclusive(toYMD);

    const [tourViews, checkoutStarted, checkoutPaid] = await Promise.all([
      countEvents('tour.view', fromIso, toIso),
      countEvents('checkout.started', fromIso, toIso),
      countEvents('checkout.paid', fromIso, toIso),
    ]);

    const startRate = tourViews ? checkoutStarted / tourViews : 0;
    const paidRate = checkoutStarted ? checkoutPaid / checkoutStarted : 0;
    const overallRate = tourViews ? checkoutPaid / tourViews : 0;

    return NextResponse.json(
      {
        window: { from: fromYMD, to: toYMD },
        counts: { tourViews, checkoutStarted, checkoutPaid },
        rates: {
          startPerView: startRate,
          paidPerStart: paidRate,
          paidPerView: overallRate,
        },
        requestId,
      },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/metrics/funnel',
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
