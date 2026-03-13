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
  limit: z.coerce.number().int().min(10).max(200).default(50),
});

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

  const { limit } = parsed.data;

  try {
    const res = await admin
      .from('events')
      .select('id,type,source,entity_id,payload,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/events/recent', message: res.error.message },
        { source: 'api', dedupeKey: `api.error:/api/admin/events/recent:${requestId}` },
      );
      return NextResponse.json(
        { error: 'Query failed', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    return NextResponse.json(
      { items: res.data ?? [], requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/events/recent',
        message: e instanceof Error ? e.message : 'unknown',
      },
      { source: 'api', dedupeKey: `api.error:/api/admin/events/recent:${requestId}` },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
