// src/app/api/admin/metrics/page-blocks/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(180).default(30),
  limit: z.coerce.number().int().min(100).max(50000).default(20000),
});

type Row = {
  type: string;
  created_at: string;
  payload: any;
};

function safeStr(v: any, max = 80): string {
  const s = typeof v === 'string' ? v : '';
  return s.trim().slice(0, max);
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    days: url.searchParams.get('days') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'invalid_query', issues: parsed.error.issues, requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const { days, limit } = parsed.data;
  const to = new Date();
  const from = new Date(to.getTime() - days * 86400000);

  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('events')
    .select('type,created_at,payload')
    .in('type', ['ui.block.view', 'ui.cta.click', 'ui.page.view'])
    .gte('created_at', from.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    await logEvent(
      'admin.metrics.page_blocks.error',
      { requestId, message: error.message },
      { source: 'server' },
    );

    return NextResponse.json(
      { ok: false, error: 'query_failed', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  const byKey = new Map<
    string,
    { key: string; kind: string; page: string; block: string; label: string; count: number }
  >();

  for (const r of (data ?? []) as Row[]) {
    const kind = r.type;
    const p = (r.payload ?? {}) as any;

    const page = safeStr(p.page, 64) || 'unknown';
    const block =
      safeStr(p.block ?? p.cta ?? '', 64) || (kind === 'ui.page.view' ? 'page' : 'unknown');
    const label = safeStr(p.label ?? '', 64);

    const key = [kind, page, block, label].join('|');
    const curr = byKey.get(key);
    if (curr) curr.count += 1;
    else byKey.set(key, { key, kind, page, block, label, count: 1 });
  }

  const items = Array.from(byKey.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 500);

  return NextResponse.json(
    {
      ok: true,
      requestId,
      window: { from: from.toISOString(), to: to.toISOString(), days },
      items,
    },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
