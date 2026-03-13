// src/app/api/admin/metrics/outbound-performance/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z
  .object({
    days: z.coerce.number().int().min(1).max(90).optional().default(30),
    limit: z.coerce.number().int().min(50).max(5000).optional().default(1000),
  })
  .strict();

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const admin = getSupabaseAdmin();
    const sinceIso = new Date(Date.now() - parsed.data.days * 24 * 60 * 60 * 1000).toISOString();

    const msgs = await (admin as any)
      .from('crm_outbound_messages')
      .select('id,deal_id,channel,status,template_key,template_variant,created_at,sent_at,outcome,replied_at,attributed_won_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(parsed.data.limit);

    if (msgs.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/metrics/outbound-performance', message: msgs.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const rows = (msgs.data || []) as any[];

    const dealIds = Array.from(new Set(rows.map((r) => r.deal_id).filter(Boolean)));
    const dealsMap = new Map<string, any>();
    if (dealIds.length) {
      const deals = await (admin as any)
        .from('deals')
        .select('id,stage,closed_at,updated_at')
        .in('id', dealIds);

      if (!deals.error) {
        for (const d of deals.data || []) dealsMap.set(d.id, d);
      }
    }

    type Key = string;
    const agg = new Map<Key, { key: string; variant: string | null; channel: string; sent: number; failed: number; queued: number; replied: number; paid: number; won7d: number }>();

    for (const r of rows) {
      const k = `${r.template_key || 'none'}|${r.template_variant || ''}|${r.channel}`;
      const cur =
        agg.get(k) || {
          key: r.template_key || 'none',
          variant: r.template_variant || null,
          channel: r.channel,
          sent: 0,
          failed: 0,
          queued: 0,
          replied: 0,
          paid: 0,
          won7d: 0,
        };

      if (r.status === 'sent') cur.sent++;
      else if (r.status === 'failed') cur.failed++;
      else if (r.status === 'queued' || r.status === 'sending') cur.queued++;

      if (r.outcome === 'replied') cur.replied++;
      if (r.outcome === 'paid') cur.paid++;

      // crude conversion: deal won within 7 days after sent_at
      const d = r.deal_id ? dealsMap.get(r.deal_id) : null;
      if (r.status === 'sent' && r.sent_at && d?.stage === 'won' && d?.closed_at) {
        const sentAt = new Date(r.sent_at).getTime();
        const closedAt = new Date(d.closed_at).getTime();
        if (closedAt >= sentAt && closedAt <= sentAt + 7 * 24 * 60 * 60 * 1000) cur.won7d++;
      }

      agg.set(k, cur);
    }

    const items = Array.from(agg.values()).sort((a, b) => (b.sent + b.queued) - (a.sent + a.queued));

    return NextResponse.json(
      {
        ok: true,
        requestId,
        window: { from: sinceIso, to: new Date().toISOString() },
        items,
      },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: any) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/outbound-performance', message: String(e?.message || 'unknown') },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
