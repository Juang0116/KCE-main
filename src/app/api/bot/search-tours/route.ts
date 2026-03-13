// src/app/api/bot/search-tours/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { listTours } from '@/features/tours/catalog.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  city: z.string().trim().min(1).max(80).optional(),
  tag: z.string().trim().min(1).max(80).optional(),
  sort: z.enum(['popular', 'price-asc', 'price-desc']).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).max(5000).optional(),
});

function addIf<T extends Record<string, any>>(obj: T, key: string, value: unknown) {
  if (typeof value === 'string') {
    const v = value.trim();
    if (v) (obj as any)[key] = v;
    return;
  }
  if (value !== undefined && value !== null) (obj as any)[key] = value;
}

/**
 * Mapper “TourLike” inline (sin depender de adapter).
 * Ajusta campos si tu frontend espera otros nombres.
 */
function toTourLike(t: any) {
  const priceMinor =
    typeof t?.base_price === 'number'
      ? t.base_price
      : typeof t?.price === 'number'
        ? t.price
        : (t?.price_minor ?? null);

  return {
    id: t?.id ?? null,
    slug: String(t?.slug ?? '').trim(),
    title: String(t?.title ?? '').trim(),
    city: t?.city ?? null,
    summary: t?.summary ?? t?.short ?? null,
    duration_hours: t?.duration_hours ?? t?.durationHours ?? null,
    base_price: priceMinor,
    currency: t?.currency ?? 'eur',
    images: Array.isArray(t?.images) ? t.images : [],
    rating: t?.rating ?? null,
    tags: Array.isArray(t?.tags) ? t.tags : [],
  };
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const rl = await checkRateLimit(req, {
    action: 'bot.search_tours',
    limit: 120,
    windowSeconds: 60 * 60,
    identity: 'ip+vid',
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', requestId },
      { status: 429, headers: withRequestId(undefined, requestId) },
    );
  }

  try {
    const url = new URL(req.url);

    const parsed = QuerySchema.safeParse({
      q: url.searchParams.get('q') ?? undefined,
      city: url.searchParams.get('city') ?? undefined,
      tag: url.searchParams.get('tag') ?? undefined,
      sort: (url.searchParams.get('sort') as any) ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const { q, city, tag, sort, limit, offset } = parsed.data;

    // Construye options SIN keys undefined (exactOptionalPropertyTypes)
    const opts: Record<string, any> = {
      sort: sort ?? 'popular',
      limit: limit ?? 12,
      offset: offset ?? 0,
    };
    addIf(opts, 'q', q);
    addIf(opts, 'city', city);
    addIf(opts, 'tag', tag);

    const res = await listTours(opts as any);

    const items = (res.items ?? []).map((t: any) => toTourLike(t));

    return NextResponse.json(
      { items, total: res.total ?? null, source: res.source ?? null, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
