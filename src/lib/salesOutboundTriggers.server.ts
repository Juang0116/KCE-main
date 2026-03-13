import 'server-only';

import { renderCrmTemplate } from '@/lib/templates.server';
import { createOutboundMessage } from '@/lib/outbound.server';
import { logEvent } from '@/lib/events.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

type DealParty = {
  name: string | null;
  email: string | null;
  phone: string | null;
  locale: string | null;
};

function normLocale(l: string | null | undefined) {
  const s = (l || 'es').toLowerCase();
  if (s.startsWith('en')) return 'en';
  if (s.startsWith('de')) return 'de';
  if (s.startsWith('fr')) return 'fr';
  return 'es';
}

function hours(n: number) {
  return n * 60 * 60 * 1000;
}

async function getDealContext(admin: any, dealId: string): Promise<{
  id: string;
  stage: string | null;
  tour_slug: string | null;
  title: string | null;
  checkout_url: string | null;
  stripe_session_id: string | null;
  amount_minor: number | null;
  currency: string | null;
  updated_at: string | null;
  closed_at: string | null;
  lead_id: string | null;
  customer_id: string | null;
  lead: any | null;
  customer: any | null;
}> {
  const res = await admin
    .from('deals')
    .select(
      'id,stage,tour_slug,title,checkout_url,stripe_session_id,amount_minor,currency,updated_at,closed_at,lead_id,customer_id,leads(email,whatsapp,first_name,last_name),customers(name,email,phone,country)',
    )
    .eq('id', dealId)
    .maybeSingle();

  if (res.error || !res.data) throw new Error(res.error?.message || 'Deal not found');
  const d: any = res.data;
  return {
    id: d.id,
    stage: d.stage ?? null,
    tour_slug: d.tour_slug ?? null,
    title: d.title ?? null,
    checkout_url: d.checkout_url ?? null,
    stripe_session_id: d.stripe_session_id ?? null,
    amount_minor: d.amount_minor ?? null,
    currency: d.currency ?? null,
    updated_at: d.updated_at ?? null,
    closed_at: d.closed_at ?? null,
    lead_id: d.lead_id ?? null,
    customer_id: d.customer_id ?? null,
    lead: d.leads ?? null,
    customer: d.customers ?? null,
  };
}

function deriveParty(d: Awaited<ReturnType<typeof getDealContext>>): DealParty {
  const customer = d.customer;
  const lead = d.lead;

  const name =
    (customer?.name as string | null) ||
    (lead
      ? [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || null
      : null) ||
    null;

  const email = (customer?.email as string | null) || (lead?.email as string | null) || null;
  const phone = (lead?.whatsapp as string | null) || (customer?.phone as string | null) || null;

  return { name, email, phone, locale: null };
}

async function recentOutboundStats(admin: any, args: { dealId: string; channel: 'whatsapp' | 'email' }) {
  const minIntervalHours = Number(process.env.CRM_OUTBOUND_MIN_INTERVAL_HOURS || '8');
  const maxPer7d = Number(process.env.CRM_OUTBOUND_MAX_PER_7D || '3');

  const sinceMin = new Date(Date.now() - hours(minIntervalHours)).toISOString();
  const since7d = new Date(Date.now() - hours(24 * 7)).toISOString();

  const recent = await admin
    .from('crm_outbound_messages')
    .select('id,status,created_at,template_key')
    .eq('deal_id', args.dealId)
    .eq('channel', args.channel)
    .gte('created_at', sinceMin)
    .in('status', ['queued', 'sending', 'sent']);

  const last7d = await admin
    .from('crm_outbound_messages')
    .select('id,status,created_at')
    .eq('deal_id', args.dealId)
    .eq('channel', args.channel)
    .gte('created_at', since7d)
    .in('status', ['queued', 'sending', 'sent']);

  const queued = await admin
    .from('crm_outbound_messages')
    .select('id,status')
    .eq('deal_id', args.dealId)
    .eq('channel', args.channel)
    .in('status', ['queued', 'sending']);

  return {
    hasRecent: !recent.error && (recent.data?.length || 0) > 0,
    count7d: !last7d.error ? last7d.data?.length || 0 : 0,
    hasQueued: !queued.error && (queued.data?.length || 0) > 0,
    maxPer7d,
  };
}

async function canEnqueue(admin: any, args: { dealId: string; channel: 'whatsapp' | 'email' }) {
  const s = await recentOutboundStats(admin, args);
  if (s.hasQueued) return { ok: false, reason: 'has_queued' as const };
  if (s.hasRecent) return { ok: false, reason: 'too_soon' as const };
  if (s.count7d >= s.maxPer7d) return { ok: false, reason: 'rate_limited_7d' as const };
  return { ok: true as const };
}

async function getLastOutboundSent(admin: any, dealId: string): Promise<any | null> {
  const r = await admin
    .from('crm_outbound_messages')
    .select('id,deal_id,status,outcome,channel,sent_at,template_key,template_variant,to_email,to_phone')
    .eq('deal_id', dealId)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (r.error) return null;
  return r.data ?? null;
}

async function hasOutboundWithTemplate(admin: any, args: { dealId: string; templateKey: string; sinceIso?: string | null }): Promise<boolean> {
  const q = admin
    .from('crm_outbound_messages')
    .select('id')
    .eq('deal_id', args.dealId)
    .eq('template_key', args.templateKey)
    .in('status', ['queued', 'sent'])
    .limit(1);
  if (args.sinceIso) q.gte('created_at', args.sinceIso);
  const r = await q;
  return !r.error && (r.data?.length ?? 0) > 0;
}

export async function maybeEnqueueDealStageMessage(args: {
  dealId: string;
  stage: string;
  locale?: string | null;
  source: string;
  requestId?: string | null;
}): Promise<{ ok: boolean; skipped?: boolean; reason?: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin not configured');

  const stage = (args.stage || '').toLowerCase().trim();

  // Only enqueue for stages that benefit from proactive messaging.
  const key =
    stage === 'contacted'
      ? 'deal.followup.contacted'
      : stage === 'qualified'
        ? 'deal.followup.qualified'
        : stage === 'proposal'
          ? 'deal.followup.proposal'
          : stage === 'checkout'
            ? 'deal.followup.checkout'
            : null;

  if (!key) return { ok: true, skipped: true, reason: 'stage_not_supported' };

  const d = await getDealContext(admin, args.dealId);
  const party = deriveParty(d);

  const locale = normLocale(args.locale || party.locale || 'es');

  // Prefer WhatsApp if available.
  const channel: 'whatsapp' | 'email' = party.phone ? 'whatsapp' : party.email ? 'email' : 'whatsapp';
  if (channel === 'whatsapp' && !party.phone) return { ok: true, skipped: true, reason: 'no_phone' };
  if (channel === 'email' && !party.email) return { ok: true, skipped: true, reason: 'no_email' };

  const ok = await canEnqueue(admin, { dealId: args.dealId, channel });
  if (!ok.ok) return { ok: true, skipped: true, reason: ok.reason };

  const tpl = await renderCrmTemplate({
    key,
    locale,
    channel,
    vars: {
      name: party.name || 'hola',
      tour: d.tour_slug || d.title || 'tu tour',
      date: '',
      people: '',
      checkout_url: d.checkout_url || '',
    },
    seed: `${args.dealId}:${key}`,
  });

  const row = await createOutboundMessage({
    channel,
    status: 'queued',
    provider: channel === 'email' ? 'resend' : 'manual',
    toEmail: channel === 'email' ? party.email : null,
    toPhone: channel === 'whatsapp' ? party.phone : null,
    subject: channel === 'email' ? tpl.subject || 'KCE' : null,
    body: tpl.body,
    dealId: args.dealId,
    leadId: d.lead_id,
    customerId: d.customer_id,
    templateKey: key,
    templateVariant: tpl.templateVariant ?? null,
    metadata: { trigger: 'stage_change', stage, source: args.source, requestId: args.requestId || null },
  });

  await logEvent(
    'crm.outbound.enqueued',
    { requestId: args.requestId || null, dealId: args.dealId, channel, templateKey: key, templateVariant: tpl.templateVariant },
    { source: 'crm', entityId: row.id, dedupeKey: `outbound:enqueued:${row.id}` },
  );

  return { ok: true };
}

export async function enqueueDealTemplateMessage(args: {
  dealId: string;
  templateKey: string;
  locale?: string | null;
  source: string;
  requestId?: string | null;
}): Promise<{ ok: boolean; skipped?: boolean; reason?: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin not configured');

  const key = String(args.templateKey || '').trim();
  if (!key) return { ok: true, skipped: true, reason: 'missing_template_key' };

  const d = await getDealContext(admin, args.dealId);
  const party = deriveParty(d);
  const locale = normLocale(args.locale || party.locale || 'es');

  const channel: 'whatsapp' | 'email' = party.phone ? 'whatsapp' : party.email ? 'email' : 'whatsapp';
  if (channel === 'whatsapp' && !party.phone) return { ok: true, skipped: true, reason: 'no_phone' };
  if (channel === 'email' && !party.email) return { ok: true, skipped: true, reason: 'no_email' };

  const ok = await canEnqueue(admin, { dealId: args.dealId, channel });
  if (!ok.ok) return { ok: true, skipped: true, reason: ok.reason };

  const tpl = await renderCrmTemplate({
    key,
    locale,
    channel,
    vars: {
      name: party.name || 'hola',
      tour: d.tour_slug || d.title || 'tu tour',
      date: '',
      people: '',
      checkout_url: d.checkout_url || '',
    },
    seed: `${args.dealId}:${key}`,
  });

  const row = await createOutboundMessage({
    channel,
    status: 'queued',
    provider: channel === 'email' ? 'resend' : 'manual',
    toEmail: channel === 'email' ? party.email : null,
    toPhone: channel === 'whatsapp' ? party.phone : null,
    subject: channel === 'email' ? tpl.subject || 'KCE' : null,
    body: tpl.body,
    dealId: args.dealId,
    leadId: d.lead_id,
    customerId: d.customer_id,
    templateKey: key,
    templateVariant: tpl.templateVariant ?? null,
    metadata: { trigger: 'noreply_followup', source: args.source, requestId: args.requestId || null },
  });

  await logEvent(
    'crm.outbound.enqueued',
    { requestId: args.requestId || null, dealId: args.dealId, channel, templateKey: key, templateVariant: tpl.templateVariant },
    { source: 'crm', entityId: row.id, dedupeKey: `outbound:enqueued:${row.id}` },
  );

  return { ok: true };
}

async function getActiveDealForParty(admin: any, args: { leadId: string | null; customerId: string | null }): Promise<string | null> {
  const q = admin
    .from('deals')
    .select('id,stage,updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (args.leadId) q.eq('lead_id', args.leadId);
  if (args.customerId) q.eq('customer_id', args.customerId);
  q.not('stage', 'in', '("won","lost")');

  const res = await q;
  if (res.error) return null;
  return res.data?.[0]?.id || null;
}

async function getConversationWaitState(admin: any, conversationId: string): Promise<{
  waitingOn: 'customer' | 'agent' | 'unknown';
  lastCustomerAt: string | null;
  lastAgentAt: string | null;
}> {
  const res = await admin
    .from('messages')
    .select('role,created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(40);

  if (res.error) return { waitingOn: 'unknown', lastCustomerAt: null, lastAgentAt: null };

  let lastCustomerAt: string | null = null;
  let lastAgentAt: string | null = null;

  for (const m of res.data || []) {
    const role = String((m as any).role || '').toLowerCase();
    if (!lastCustomerAt && role === 'user') lastCustomerAt = (m as any).created_at || null;
    // schema may use "assistant" or "agent" depending on the route that inserted the message
    if (!lastAgentAt && (role === 'assistant' || role === 'agent')) lastAgentAt = (m as any).created_at || null;
    if (lastCustomerAt && lastAgentAt) break;
  }

  if (lastAgentAt && (!lastCustomerAt || new Date(lastAgentAt) > new Date(lastCustomerAt))) {
    return { waitingOn: 'customer', lastCustomerAt, lastAgentAt };
  }
  if (lastCustomerAt) return { waitingOn: 'agent', lastCustomerAt, lastAgentAt };
  return { waitingOn: 'unknown', lastCustomerAt, lastAgentAt };
}

export async function runSalesOutboundTriggers(args: {
  requestId?: string | null;
  limit?: number;
  dryRun?: boolean;
}): Promise<{ ok: true; processed: number; enqueued: number; skipped: number }> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin not configured');

  const limit = Math.max(1, Math.min(200, args.limit ?? 50));
  const dryRun = !!args.dryRun;

  const checkoutAfterHours = Number(process.env.CRM_CHECKOUT_UNPAID_AFTER_HOURS || '2');
  const waitCustomerAfterHours = Number(process.env.CRM_WAITING_CUSTOMER_AFTER_HOURS || '24');

  let processed = 0;
  let enqueued = 0;
  let skipped = 0;

  // 1) Checkout created but unpaid after X hours -> enqueue reminder
  const checkoutCutoff = new Date(Date.now() - hours(checkoutAfterHours)).toISOString();
  const dealsRes = await admin
    .from('deals')
    .select('id,stage,lead_id,customer_id,updated_at,closed_at')
    .eq('stage', 'checkout')
    .is('closed_at', null)
    .lt('updated_at', checkoutCutoff)
    .order('updated_at', { ascending: true })
    .limit(limit);

  if (!dealsRes.error && dealsRes.data?.length) {
    for (const d of dealsRes.data as any[]) {
      processed++;
      if (dryRun) {
        skipped++;
        continue;
      }
      const r = await maybeEnqueueDealStageMessage({
        dealId: d.id,
        stage: 'checkout',
        source: 'cron.checkout_unpaid',
        requestId: args.requestId || null,
      });
      if (r.skipped) skipped++;
      else enqueued++;
    }
  }

  // 2) Tickets waiting on customer for > X hours -> ping (use deal followup for active deal)
  const ticketCutoff = new Date(Date.now() - hours(waitCustomerAfterHours)).toISOString();
  const ticketsRes = await admin
    .from('tickets')
    .select('id,lead_id,customer_id,conversation_id,last_message_at,status,priority')
    .in('status', ['open', 'pending', 'in_progress'])
    .lt('last_message_at', ticketCutoff)
    .not('conversation_id', 'is', null)
    .order('last_message_at', { ascending: true })
    .limit(limit);

  if (!ticketsRes.error && ticketsRes.data?.length) {
    for (const t of ticketsRes.data as any[]) {
      processed++;

      const convId = t.conversation_id as string | null;
      if (!convId) {
        skipped++;
        continue;
      }

      const ws = await getConversationWaitState(admin, convId);
      if (ws.waitingOn !== 'customer' || !ws.lastAgentAt) {
        skipped++;
        continue;
      }

      const ageHours = (Date.now() - new Date(ws.lastAgentAt).getTime()) / 36e5;
      if (ageHours < waitCustomerAfterHours) {
        skipped++;
        continue;
      }

      const dealId = await getActiveDealForParty(admin, { leadId: t.lead_id ?? null, customerId: t.customer_id ?? null });
      if (!dealId) {
        skipped++;
        continue;
      }

      if (dryRun) {
        skipped++;
        continue;
      }

      const r = await maybeEnqueueDealStageMessage({
        dealId,
        stage: 'contacted',
        source: 'cron.awaiting_customer',
        requestId: args.requestId || null,
      });
      if (r.skipped) skipped++;
      else enqueued++;
    }
  }

  // 3) No-reply follow-ups: if we sent an outbound and the customer hasn't replied, send 24h/48h nudges.
  const follow24h = Number(process.env.CRM_FOLLOWUP_NOREPLY_24H || '24');
  const follow48h = Number(process.env.CRM_FOLLOWUP_NOREPLY_48H || '48');
  const since30d = new Date(Date.now() - hours(24 * 30)).toISOString();

  const activeRes = await admin
    .from('deals')
    .select('id,stage,closed_at,updated_at')
    .in('stage', ['proposal', 'checkout'])
    .is('closed_at', null)
    .order('updated_at', { ascending: true })
    .limit(limit);

  if (!activeRes.error && activeRes.data?.length) {
    for (const d of activeRes.data as any[]) {
      processed++;

      const last = await getLastOutboundSent(admin, d.id);
      if (!last || last.outcome !== 'none' || !last.sent_at) {
        skipped++;
        continue;
      }

      // Only follow-up on our stage nudges to avoid interfering with manual templates.
      const lastKey = String(last.template_key || '');
      if (!['deal.followup.checkout', 'deal.followup.proposal'].includes(lastKey)) {
        skipped++;
        continue;
      }

      const ageHours = (Date.now() - new Date(last.sent_at).getTime()) / 36e5;
      if (ageHours < follow24h) {
        skipped++;
        continue;
      }

      const stage = String(d.stage || '').toLowerCase();
      const key24 = stage === 'checkout' ? 'deal.followup.checkout_24h' : 'deal.followup.proposal_24h';
      const key48 = stage === 'checkout' ? 'deal.followup.checkout_48h' : 'deal.followup.proposal_48h';

      const want48 = ageHours >= follow48h;
      const targetKey = want48 ? key48 : key24;

      const exists = await hasOutboundWithTemplate(admin, { dealId: d.id, templateKey: targetKey, sinceIso: since30d });
      if (exists) {
        skipped++;
        continue;
      }

      if (dryRun) {
        skipped++;
        continue;
      }

      const r = await enqueueDealTemplateMessage({
        dealId: d.id,
        templateKey: targetKey,
        source: want48 ? 'cron.noreply_48h' : 'cron.noreply_24h',
        requestId: args.requestId || null,
      });
      if (r.skipped) skipped++;
      else enqueued++;
    }
  }

  return { ok: true, processed, enqueued, skipped };
}
