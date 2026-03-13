// src/app/api/admin/tasks/route.ts
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
  status: z.enum(['open', 'in_progress', 'done', 'canceled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  q: z.string().optional(),
  // Optional scoped filters
  deal_id: z.string().uuid().optional(),
  ticket_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(100).default(25),
});

const CreateSchema = z.object({
  deal_id: z.string().uuid().optional(),
  ticket_id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(500),
  status: z.enum(['open', 'in_progress', 'done', 'canceled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assigned_to: z.string().trim().max(200).optional(),
  due_at: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      status: url.searchParams.get('status') ?? undefined,
      priority: url.searchParams.get('priority') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      deal_id: url.searchParams.get('deal_id') ?? undefined,
      ticket_id: url.searchParams.get('ticket_id') ?? undefined,
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const { status, priority, q, deal_id, ticket_id, page, limit } = parsed.data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // IMPORTANT: your generated Database types currently do NOT include "tasks",
    // so we intentionally loosen typing here to unblock build.
    const admin = getSupabaseAdmin() as any;

    // Count (best-effort)
    const countQ = admin.from('tasks').select('id', { count: 'exact', head: true });
    if (status) countQ.eq('status', status);
    if (priority) countQ.eq('priority', priority);
    if (q?.trim()) countQ.ilike('title', `%${q.trim()}%`);
    if (deal_id) countQ.eq('deal_id', deal_id);
    if (ticket_id) countQ.eq('ticket_id', ticket_id);
    const countRes = await countQ;
    const total = countRes.count ?? null;

    let query = admin
      .from('tasks')
      .select(
        'id,deal_id,ticket_id,title,status,priority,assigned_to,due_at,created_at,updated_at,' +
          'deals:deals(title,stage,tour_slug)',
      )
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (q?.trim()) query = query.ilike('title', `%${q.trim()}%`);
    if (deal_id) query = query.eq('deal_id', deal_id);
    if (ticket_id) query = query.eq('ticket_id', ticket_id);

    const res = await query;
    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/tasks', message: res.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    return NextResponse.json(
      { items: res.data ?? [], page, limit, total, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/tasks', message: e instanceof Error ? e.message : 'unknown' },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    // IMPORTANT: loosen typing until Database types include "tasks"
    const admin = getSupabaseAdmin() as any;

    const ins = await admin
      .from('tasks')
      .insert({
        deal_id: parsed.data.deal_id ?? null,
        ticket_id: parsed.data.ticket_id ?? null,
        title: parsed.data.title,
        status: parsed.data.status ?? 'open',
        priority: parsed.data.priority ?? 'normal',
        assigned_to: parsed.data.assigned_to ?? null,
        due_at: parsed.data.due_at ?? null,
      })
      .select('id')
      .single();

    if (ins.error || !ins.data?.id) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/tasks', message: ins.error?.message || 'insert failed' },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    await logEvent(
      'task.created',
      { requestId, taskId: ins.data.id, source: 'admin' },
      { source: 'admin', entityId: ins.data.id },
    );

    return NextResponse.json(
      { ok: true, taskId: ins.data.id, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/tasks', message: e instanceof Error ? e.message : 'unknown' },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
