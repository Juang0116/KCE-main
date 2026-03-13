import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  status: z.enum(['open', 'in_progress', 'done', 'canceled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  q: z.string().optional(),
  deal_id: z.string().uuid().optional(),
  ticket_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(2000),
});

function toCsvValue(v: unknown) {
  const s = String(v ?? '');
  if (/\n|\r|,|"/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const rl = await checkRateLimit(req, {
    action: 'admin.export.tasks',
    limit: 10,
    windowSeconds: 60,
    identity: 'ip+vid',
    failOpen: true,
  });

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many export requests', code: 'RATE_LIMIT', retryAfterSeconds: rl.retryAfterSeconds ?? 60, requestId },
      { status: 429, headers: withRequestId({ 'Retry-After': String(rl.retryAfterSeconds ?? 60) }, requestId) },
    );
  }

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      status: url.searchParams.get('status') ?? undefined,
      priority: url.searchParams.get('priority') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      deal_id: url.searchParams.get('deal_id') ?? undefined,
      ticket_id: url.searchParams.get('ticket_id') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const admin = getSupabaseAdmin() as any;

    let query = admin
      .from('tasks')
      .select('id,deal_id,ticket_id,title,status,priority,assigned_to,due_at,created_at,updated_at')
      .order('updated_at', { ascending: false })
      .limit(Math.max(1, Math.min(5000, parsed.data.limit)));

    if (parsed.data.status) query = query.eq('status', parsed.data.status);
    if (parsed.data.priority) query = query.eq('priority', parsed.data.priority);
    if (parsed.data.deal_id) query = query.eq('deal_id', parsed.data.deal_id);
    if (parsed.data.ticket_id) query = query.eq('ticket_id', parsed.data.ticket_id);
    if (parsed.data.q?.trim()) query = query.ilike('title', `%${parsed.data.q.trim()}%`);

    const res = await query;
    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/tasks/export', message: res.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const headers = [
      'id',
      'deal_id',
      'ticket_id',
      'title',
      'status',
      'priority',
      'assigned_to',
      'due_at',
      'created_at',
      'updated_at',
    ];

    const rows = ((res.data ?? []) as any[]).map((r: any) => headers.map((h) => r?.[h]));
    const csv = [headers.join(','), ...rows.map((row: unknown[]) => row.map(toCsvValue).join(','))].join('\n');

    await logEvent('export.csv', { request_id: requestId, entity: 'tasks', count: rows.length }, { source: 'admin' });

    return new NextResponse(csv, {
      status: 200,
      headers: withRequestId(
        {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tasks_${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
        },
        requestId,
      ),
    });
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/tasks/export', message: e instanceof Error ? e.message : 'unknown' },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
