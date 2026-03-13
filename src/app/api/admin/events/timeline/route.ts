// src/app/api/admin/events/timeline/route.ts
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
  session_id: z.string().trim().min(1).max(256).optional(),
  entity_id: z.string().trim().min(1).max(2048).optional(),
  limit: z.coerce.number().int().min(10).max(500).default(200),
});

function splitIds(v?: string): string[] {
  if (!v) return [];
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Supabase admin not configured', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) },
    );
  }

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const { session_id, entity_id, limit } = parsed.data;

  const ids = new Set<string>();
  for (const id of splitIds(entity_id)) ids.add(id);

  // If they pass a stripe session id, try to resolve booking id and include both.
  if (session_id) {
    ids.add(session_id);
    try {
      // IMPORTANT: cast to any to avoid Database typing returning `never`
      const bookingRes = await (admin as any)
        .from('bookings')
        .select('id,customer_email')
        .eq('stripe_session_id', session_id)
        .maybeSingle();

      if (bookingRes?.data?.id) ids.add(String(bookingRes.data.id));

      const email = String(bookingRes?.data?.customer_email || '')
        .trim()
        .toLowerCase();

      if (email) {
        const customerRes = await (admin as any)
          .from('customers')
          .select('id')
          .ilike('email', email)
          .maybeSingle();

        if (customerRes?.data?.id) ids.add(String(customerRes.data.id));
      }
    } catch {
      // ignore
    }
  }

  const entityIds = [...ids].slice(0, 50);
  if (!entityIds.length) {
    return NextResponse.json(
      { error: 'Provide session_id or entity_id', requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  try {
    const res = await (admin as any)
      .from('events')
      .select('id,type,source,entity_id,dedupe_key,payload,created_at')
      .in('entity_id', entityIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (res?.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/events/timeline', message: res.error.message },
        { source: 'api', dedupeKey: `api.error:/api/admin/events/timeline:${requestId}` },
      );
      return NextResponse.json(
        { error: 'Query failed', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    return NextResponse.json(
      { entityIds, items: res?.data ?? [], requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/events/timeline',
        message: e instanceof Error ? e.message : 'unknown',
      },
      { source: 'api', dedupeKey: `api.error:/api/admin/events/timeline:${requestId}` },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
