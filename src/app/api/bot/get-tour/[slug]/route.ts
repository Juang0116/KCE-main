// src/app/api/bot/get-tour/[slug]/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { toTourLike } from '@/features/tours/adapters';
import { getTourBySlug } from '@/features/tours/catalog.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const requestId = getRequestId(req.headers);
  const { slug } = await ctx.params;

  const t = await getTourBySlug(slug);
  if (!t) {
    return NextResponse.json(
      { error: 'Tour not found', requestId },
      { status: 404, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, item: toTourLike(t as any), requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
