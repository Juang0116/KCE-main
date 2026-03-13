// src/app/api/admin/reviews/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export async function GET(req: NextRequest) {
  // ✅ Protege API admin (Basic Auth)
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
  const parsed = QuerySchema.safeParse({
    status: url.searchParams.get('status') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const { status, limit, page } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = admin
    .from('reviews')
    .select(
      'id,tour_slug,tour_id,rating,title,body,comment,customer_name,customer_email,avatar_url,media_urls,face_consent,status,approved,published_at,created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status === 'pending') {
    // legacy rows may have status = null
    q = q.or('status.eq.pending,status.is.null');
  } else {
    q = q.eq('status', status);
  }

  const { data, error, count } = await q;

  if (error) {
    return NextResponse.json(
      { error: error.message, requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { items: data ?? [], page, limit, total: count ?? null, requestId },
    { headers: withRequestId(undefined, requestId) },
  );
}
