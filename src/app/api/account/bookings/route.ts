// src/app/api/account/bookings/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { jsonError } from '@/lib/apiErrors';
import { logEvent } from '@/lib/events.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

function firstImageUrl(images: any): string | null {
  if (!images) return null;
  // images can be array of urls/objects depending on seed
  if (Array.isArray(images)) {
    const first = images[0];
    if (typeof first === 'string') return first;
    if (first && typeof first.url === 'string') return first.url;
    if (first && typeof first.src === 'string') return first.src;
  }
  if (typeof images === 'object') {
    const maybe = (images as any).url || (images as any).src;
    if (typeof maybe === 'string') return maybe;
  }
  return null;
}

type BookingItem = {
  id: string;
  status: string | null;
  date: string | null;
  persons: number | null;
  total: number | null;
  currency: string | null;
  stripe_session_id: string | null;
  created_at: string | null;
  tour: {
    id: string;
    title: string | null;
    slug: string | null;
    city: string | null;
    cover_image: string | null;
  } | null;
};

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  // Rate limit: prevent abuse
  const rl = await checkRateLimit(req, {
    action: 'account.bookings.get',
    limit: 30,
    windowSeconds: 300,
    identity: 'vid',
  });
  if (!rl.allowed) {
    void logEvent('api.rate_limited', {
      request_id: requestId,
      route: '/api/account/bookings',
      action: 'account.bookings.get',
      key_base: rl.keyBase,
    });
    return jsonError(req, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Rate limit exceeded',
      requestId,
    });
  }

  const token = bearerToken(req);
  if (!token)
    return jsonError(req, {
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Missing bearer token',
      requestId,
    });

  const admin = getSupabaseAdmin();

  // Validate token and get user
  const { data: userRes, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userRes?.user) {
    void logEvent('auth.invalid_token', { request_id: requestId, route: '/api/account/bookings' });
    return jsonError(req, {
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Invalid session',
      requestId,
    });
  }
  const userId = userRes.user.id;

  const { data, error } = await admin
    .from('bookings')
    .select(
      [
        'id',
        'status',
        'date',
        'persons',
        'total',
        'currency',
        'stripe_session_id',
        'created_at',
        'tours:tour_id(id,title,slug,city,images)',
      ].join(','),
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    void logEvent('api.error', {
      request_id: requestId,
      route: '/api/account/bookings',
      message: error.message,
      code: error.code,
    });
    return jsonError(req, {
      status: 500,
      code: 'INTERNAL',
      message: 'Failed to load bookings',
      requestId,
    });
  }

  const items: BookingItem[] = (data || []).map((row: any) => ({
    id: String(row.id),
    status: row.status ?? null,
    date: row.date ?? null,
    persons: row.persons ?? null,
    total: row.total ?? null,
    currency: row.currency ?? null,
    stripe_session_id: row.stripe_session_id ?? null,
    created_at: row.created_at ?? null,
    tour: row.tours
      ? {
          id: String(row.tours.id),
          title: row.tours.title ?? null,
          slug: row.tours.slug ?? null,
          city: row.tours.city ?? null,
          cover_image: firstImageUrl(row.tours.images),
        }
      : null,
  }));

  void logEvent('account.bookings_view', {
    request_id: requestId,
    user_id: userId,
    count: items.length,
  });

  return NextResponse.json({ items }, { headers: { 'x-request-id': requestId } });
}
