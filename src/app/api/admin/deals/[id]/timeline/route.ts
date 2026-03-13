// src/app/api/admin/deals/[id]/timeline/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

const ParamsSchema = z.object({ id: z.string().uuid() });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toISO(v: string | null | undefined) {
  return v ?? null;
}

function pickTs(o: any): string {
  return (
    o?.sent_at ||
    o?.replied_at ||
    o?.attributed_won_at ||
    o?.due_at ||
    o?.last_message_at ||
    o?.updated_at ||
    o?.created_at ||
    new Date().toISOString()
  );
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const { id } = await ctx.params;
    const p = ParamsSchema.safeParse({ id });
    if (!p.success) {
      return NextResponse.json(
        { error: 'Bad params', details: p.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const admin = getSupabaseAdmin();

    const dealRes = await (admin as any)
      .from('deals')
      .select(
        'id,lead_id,customer_id,tour_slug,checkout_url,stripe_session_id,title,stage,amount_minor,currency,probability,assigned_to,notes,source,created_at,updated_at,closed_at',
      )
      .eq('id', p.data.id)
      .maybeSingle();

    if (dealRes.error) {
      await logEvent('api.error', { requestId, route: '/api/admin/deals/[id]/timeline', message: dealRes.error.message }, { source: 'api' });
      return NextResponse.json({ error: 'DB error (deal)', requestId }, { status: 500, headers: withRequestId(undefined, requestId) });
    }
    if (!dealRes.data) {
      return NextResponse.json({ error: 'Deal not found', requestId }, { status: 404, headers: withRequestId(undefined, requestId) });
    }

    const deal = dealRes.data as any;

    const [tasksRes, outRes, evRes] = await Promise.all([
      (admin as any)
        .from('tasks')
        .select('id,deal_id,ticket_id,title,status,priority,due_at,created_at,updated_at')
        .eq('deal_id', deal.id)
        .order('created_at', { ascending: false })
        .limit(200),
      (admin as any)
        .from('crm_outbound_messages')
        .select(
          'id,deal_id,channel,status,provider,to_email,to_phone,subject,template_key,template_variant,outcome,created_at,updated_at,sent_at,replied_at,attributed_won_at,attributed_booking_id,error',
        )
        .eq('deal_id', deal.id)
        .order('created_at', { ascending: false })
        .limit(200),
      (admin as any)
        .from('events')
        .select('id,type,payload,source,created_at,entity_id')
        .eq('entity_id', deal.id)
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    if (tasksRes.error || outRes.error || evRes.error) {
      const msg = tasksRes.error?.message || outRes.error?.message || evRes.error?.message || 'unknown';
      await logEvent('api.error', { requestId, route: '/api/admin/deals/[id]/timeline', message: msg }, { source: 'api' });
      return NextResponse.json({ error: 'DB error (related)', requestId }, { status: 500, headers: withRequestId(undefined, requestId) });
    }

    // Try to load latest ticket + last messages (optional)
    let ticket: any = null;
    let messages: any[] = [];
    if (deal.lead_id || deal.customer_id) {
      const tQ = (admin as any)
        .from('tickets')
        .select('id,subject,status,priority,channel,conversation_id,last_message_at,created_at,lead_id,customer_id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (deal.lead_id && deal.customer_id) {
        tQ.or(`lead_id.eq.${deal.lead_id},customer_id.eq.${deal.customer_id}`);
      } else if (deal.lead_id) {
        tQ.eq('lead_id', deal.lead_id);
      } else if (deal.customer_id) {
        tQ.eq('customer_id', deal.customer_id);
      }

      const tRes = await tQ.maybeSingle();
      if (!tRes.error && tRes.data) {
        ticket = tRes.data;
        if (ticket.conversation_id) {
          const msgRes = await (admin as any)
            .from('messages')
            .select('id,role,content,created_at')
            .eq('conversation_id', ticket.conversation_id)
            .order('created_at', { ascending: false })
            .limit(30);
          if (!msgRes.error) messages = msgRes.data ?? [];
        }
      }
    }

    // Compose timeline
    const items: Array<any> = [];

    for (const t of tasksRes.data ?? []) {
      items.push({
        kind: 'task',
        ts: pickTs(t),
        title: t.title,
        detail: `${t.status ?? 'open'} · ${t.priority ?? 'normal'}${t.due_at ? ` · vence ${t.due_at}` : ''}`,
        meta: { id: t.id, status: t.status, priority: t.priority, due_at: toISO(t.due_at) },
      });
    }

    for (const o of outRes.data ?? []) {
      const who = o.to_email ? `→ ${o.to_email}` : o.to_phone ? `→ ${o.to_phone}` : '';
      items.push({
        kind: 'outbound',
        ts: pickTs(o),
        title: `${o.channel ?? 'any'} · ${o.status}${o.outcome ? ` · ${o.outcome}` : ''} ${who}`.trim(),
        detail: `${o.template_key ?? 'manual'}${o.template_variant ? ` (${o.template_variant})` : ''}${o.error ? ` · error: ${o.error}` : ''}`,
        meta: { id: o.id, status: o.status, outcome: o.outcome, sent_at: toISO(o.sent_at), replied_at: toISO(o.replied_at) },
      });
    }

    for (const e of evRes.data ?? []) {
      items.push({
        kind: 'event',
        ts: pickTs(e),
        title: e.type,
        detail: e.source ? `source: ${e.source}` : '',
        meta: { id: e.id, payload: e.payload ?? null },
      });
    }

    // Messages (optional)
    for (const m of messages) {
      items.push({
        kind: 'message',
        ts: pickTs(m),
        title: m.role === 'user' ? 'Cliente' : 'Agente',
        detail: String(m.content ?? '').slice(0, 280),
        meta: { id: m.id, role: m.role },
      });
    }

    items.sort((a, b) => String(b.ts).localeCompare(String(a.ts)));

    return NextResponse.json(
      { deal, ticket, timeline: items, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: any) {
    await logEvent('api.error', { requestId, route: '/api/admin/deals/[id]/timeline', message: e?.message || String(e) }, { source: 'api' });
    return NextResponse.json({ error: 'Unexpected error', requestId }, { status: 500, headers: withRequestId(undefined, requestId) });
  }
}
