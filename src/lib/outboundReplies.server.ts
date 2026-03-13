import 'server-only';

import { logEvent } from '@/lib/events.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

function nowIso() {
  return new Date().toISOString();
}

function normEmail(s: string | null | undefined): string {
  return String(s || '').trim().toLowerCase();
}

function daysAgoIso(days: number) {
  const ms = Math.max(1, days) * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms).toISOString();
}

async function markReplied(
  admin: any,
  params: {
    messageId: string;
    note?: string | null;
    source: string;
    requestId?: string | null;
    extra?: Record<string, any>;
  },
) {
  const upd: any = { outcome: 'replied', replied_at: nowIso() };
  if (params.note && String(params.note).trim()) {
    upd.replied_note = String(params.note).trim().slice(0, 2000);
  }

  const u = await admin
    .from('crm_outbound_messages')
    .update(upd)
    .eq('id', params.messageId)
    .eq('outcome', 'none')
    .select('*')
    .maybeSingle();

  if (u.error || !u.data) return null;

  await logEvent(
    'crm.outbound.replied_auto',
    {
      requestId: params.requestId || null,
      messageId: params.messageId,
      dealId: (u.data as any).deal_id,
      ticketId: (u.data as any).ticket_id,
      channel: (u.data as any).channel,
      templateKey: (u.data as any).template_key,
      templateVariant: (u.data as any).template_variant,
      source: params.source,
      ...(params.extra || {}),
    },
    {
      source: 'crm',
      entityId: params.messageId,
      dedupeKey: `outbound:replied_auto:${params.messageId}:${params.source}`,
    },
  );

  return u.data as any;
}

export async function autoMarkRepliedFromEmail(args: {
  fromEmail: string;
  note?: string | null;
  requestId?: string | null;
  lookbackDays?: number;
}) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin not configured');

  const from = normEmail(args.fromEmail);
  if (!from) return null;

  const since = daysAgoIso(Math.min(Math.max(args.lookbackDays ?? 14, 1), 60));

  const r = await admin
    .from('crm_outbound_messages')
    .select('id,deal_id,ticket_id,channel,status,sent_at,outcome,to_email')
    .eq('channel', 'email')
    .eq('status', 'sent')
    .eq('outcome', 'none')
    .eq('to_email', from)
    .gte('sent_at', since)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (r.error || !r.data?.id) return null;

  return await markReplied(admin, {
    messageId: r.data.id as string,
    note: args.note || null,
    source: 'resend_inbound',
    requestId: args.requestId || null,
    extra: { fromEmail: from },
  });
}

async function getActiveDealForParty(admin: any, args: { leadId: string | null; customerId: string | null }): Promise<string | null> {
  const q = admin.from('deals').select('id,updated_at').order('updated_at', { ascending: false }).limit(1);

  if (args.leadId) q.eq('lead_id', args.leadId);
  if (args.customerId) q.eq('customer_id', args.customerId);

  q.not('stage', 'in', '("won","lost")');

  const res = await q;
  if (res.error) return null;
  return (res.data?.[0] as any)?.id ?? null;
}

export async function autoMarkRepliedFromConversation(args: {
  conversationId: string;
  note?: string | null;
  requestId?: string | null;
  lookbackDays?: number;
}) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin not configured');

  const conversationId = String(args.conversationId || '').trim();
  if (!conversationId) return null;

  const t = await admin
    .from('tickets')
    .select('id,lead_id,customer_id')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const leadId = (t.data as any)?.lead_id ?? null;
  const customerId = (t.data as any)?.customer_id ?? null;

  const dealId = await getActiveDealForParty(admin, { leadId, customerId });
  if (!dealId) return null;

  const since = daysAgoIso(Math.min(Math.max(args.lookbackDays ?? 14, 1), 60));

  const r = await admin
    .from('crm_outbound_messages')
    .select('id,deal_id,ticket_id,channel,status,sent_at,outcome')
    .eq('deal_id', dealId)
    .eq('status', 'sent')
    .eq('outcome', 'none')
    .gte('sent_at', since)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (r.error || !r.data?.id) return null;

  return await markReplied(admin, {
    messageId: r.data.id as string,
    note: args.note || null,
    source: 'webchat_message',
    requestId: args.requestId || null,
    extra: { conversationId, dealId },
  });
}
