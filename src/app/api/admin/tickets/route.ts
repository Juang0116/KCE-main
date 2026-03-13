// src/app/api/admin/tickets/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  // NOTE: DB also allows 'in_progress' (see supabase_patch_p34_tickets_constraints.sql)
  status: z.enum(['open', 'pending', 'in_progress', 'resolved']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  q: z.string().trim().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(5).max(100).default(20),
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

  const { status, priority, q, page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Base query
  let query = admin
    .from('tickets')
    .select(
      [
        'id',
        'lead_id',
        'customer_id',
        'conversation_id',
        'subject',
        'summary',
        'status',
        'priority',
        'channel',
        'assigned_to',
        'last_message_at',
        'created_at',
        'updated_at',
        'closed_at',
        'resolved_at',
      ].join(','),
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);

  if (q) {
    // Busca por subject o summary
    // OJO: esto requiere pg_trgm? No. Es solo ILIKE.
    query = query.or(`subject.ilike.%${q}%,summary.ilike.%${q}%`);
  }

  const res = await query;

  if (res.error) {
    return NextResponse.json(
      {
        error: 'DB error',
        supabase: { message: res.error.message, code: res.error.code },
        requestId,
      },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { items: res.data ?? [], page, limit, total: res.count ?? null, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
