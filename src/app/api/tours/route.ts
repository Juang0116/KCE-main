// src/app/api/tours/route.ts
import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';

import { toTourLike } from '@/features/tours/adapters';
import { listTours } from '@/features/tours/catalog.server';
import { corsHeaders, corsPreflight } from '@/lib/cors';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ───────────── Utils ───────────── */
const pick = (v: string | null, max = 80) => (v ?? '').trim().slice(0, max);
const pickSort = (v: string | null) =>
  v === 'price-asc' || v === 'price-desc' ? (v as 'price-asc' | 'price-desc') : 'popular';

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req, { methods: 'GET,OPTIONS' });
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const headers = corsHeaders(req);

  try {
    const { searchParams } = new URL(req.url);

    const q = pick(searchParams.get('q'), 80);
    const tag = pick(searchParams.get('tag'), 40);
    const city = pick(searchParams.get('city'), 40);
    const sort = pickSort(searchParams.get('sort'));

    const limitRaw = Number(searchParams.get('limit') ?? 60);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 60;

    const res = await listTours({ q, tag, city, sort, limit });
    const items = (res.items ?? []).map((t) => toTourLike(t));

    return NextResponse.json(
      { ok: true, requestId, source: res.source, total: res.total, data: items },
      {
        status: 200,
        headers: {
          ...withRequestId(headers, requestId),
          'Cache-Control': 'no-store',
          'X-Source': String(res.source ?? ''),
          'X-Total': String(res.total ?? 0),
        },
      },
    );
  } catch (e: unknown) {
    console.error('[api/tours] error:', e);
    void logEvent('api.error', {
      request_id: requestId,
      route: '/api/tours',
      error: e instanceof Error ? e.message : String(e),
    });

    return NextResponse.json(
      { ok: false, requestId, error: 'Failed to list tours' },
      {
        status: 500,
        headers: withRequestId({ ...headers, 'Cache-Control': 'no-store' }, requestId),
      },
    );
  }
}
