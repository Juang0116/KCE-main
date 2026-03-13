// src/lib/botStorage.server.ts
import 'server-only';

import { logEvent } from '@/lib/events.server';
import { autoMarkRepliedFromConversation } from '@/lib/outboundReplies.server';
import { normalizeEmail, normalizePhone } from '@/lib/normalize';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import type { TablesInsert } from '@/types/supabase';

export type BotChannel = 'webchat' | 'whatsapp' | 'email';
export type BotMessageRole = 'user' | 'assistant' | 'agent';

export async function ensureLead(args: {
  email?: string | null;
  whatsapp?: string | null;
  source?: string | null;
  language?: string | null;
  consent?: boolean;
  requestId?: string | null;
}): Promise<string | null> {
  if (!args.consent) return null;

  const normEmail = normalizeEmail(args.email) || null;
  const normWhatsapp = normalizePhone(args.whatsapp) || null;

  if (!normEmail && !normWhatsapp) return null;

  const admin = getSupabaseAdmin();

  // Best-effort: reuse an existing lead by email/whatsapp if present.
  try {
    if (normEmail) {
      const q = await admin
        .from('leads')
        .select('id')
        .eq('email', normEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (q.data?.id) return q.data.id;
    }

    if (normWhatsapp) {
      const q = await admin
        .from('leads')
        .select('id')
        .eq('whatsapp', normWhatsapp)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (q.data?.id) return q.data.id;
    }
  } catch {
    // ignore and create a new lead
  }

  const payload: TablesInsert<'leads'> = {
    email: normEmail,
    whatsapp: normWhatsapp,
    source: (args.source || 'chat').trim(),
    language: (args.language || 'es').trim(),
    stage: 'new',
    tags: [],
    notes: null,
  };

  const ins = await admin.from('leads').insert(payload).select('id').single();
  if (ins.error || !ins.data?.id) return null;

  const leadId = ins.data.id;

  void logEvent(
    'lead.created',
    {
      requestId: args.requestId || null,
      leadId,
      email: normEmail,
      whatsapp: normWhatsapp,
      source: args.source || 'chat',
      language: args.language || 'es',
    },
    { source: 'crm', entityId: leadId, dedupeKey: `lead:created:${leadId}` },
  );

  return leadId;
}

export async function ensureConversation(args: {
  conversationId?: string | null;
  leadId?: string | null;
  customerId?: string | null;
  channel?: BotChannel | null;
  language?: string | null;
  requestId?: string | null;
}): Promise<string> {
  const admin = getSupabaseAdmin();

  const channel = (args.channel || 'webchat') as BotChannel;

  // DB constraint for conversations.channel is ('web','whatsapp','email','chat')
  const channelDb = (channel === 'webchat' ? 'web' : channel) as
    | 'web'
    | 'whatsapp'
    | 'email'
    | 'chat';

  // DB constraint for conversations.locale is ('es','en','fr','de')
  const locale = ((args.language || 'es')?.trim() || 'es').slice(0, 2).toLowerCase();
  const localeDb = (['es', 'en', 'fr', 'de'] as const).includes(locale as any)
    ? (locale as any)
    : 'es';

  if (args.conversationId) {
    // best-effort: attach lead/customer if missing
    try {
      const patch: Partial<TablesInsert<'conversations'>> = {};
      if (args.leadId) patch.lead_id = args.leadId;
      if (args.customerId) patch.customer_id = args.customerId;

      if (Object.keys(patch).length > 0) {
        await admin.from('conversations').update(patch).eq('id', args.conversationId);
      }
    } catch {
      // ignore
    }

    return args.conversationId;
  }

  const ins = await admin
    .from('conversations')
    .insert({
      channel: channelDb,
      locale: localeDb,
      status: 'open',
      lead_id: args.leadId || null,
      customer_id: args.customerId || null,
    })
    .select('id')
    .single();

  if (ins.error || !ins.data?.id) {
    // last resort
    return `local_${Date.now()}`;
  }

  const conversationId = ins.data.id;

  void logEvent(
    'chat.conversation_started',
    {
      requestId: args.requestId || null,
      conversationId,
      channel: channelDb,
      locale: localeDb,
      leadId: args.leadId || null,
    },
    { source: 'chat', entityId: conversationId, dedupeKey: `chat:conversation:${conversationId}` },
  );

  return conversationId;
}

export async function appendMessage(args: {
  conversationId: string;
  role: BotMessageRole;
  content: string;
  meta?: Record<string, unknown> | null;
  requestId?: string | null;
}): Promise<string | null> {
  const admin = getSupabaseAdmin();

  const ins = await admin
    .from('messages')
    .insert({
      conversation_id: args.conversationId,
      role: args.role,
      content: args.content,
      meta: (args.meta ?? null) as any, // meta es Json en types, aquí es record → se serializa igual
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (ins.error || !ins.data?.id) return null;

  const msgId = ins.data.id;

  void logEvent(
    'chat.message',
    {
      requestId: args.requestId || null,
      conversationId: args.conversationId,
      messageId: msgId,
      role: args.role,
    },
    { source: 'chat', entityId: args.conversationId, dedupeKey: `chat:msg:${msgId}` },
  );

  // Closed-loop: if the customer replies in webchat, mark the last outbound as replied.
  if (args.role === 'user') {
    try {
      await autoMarkRepliedFromConversation({
        conversationId: args.conversationId,
        note: 'Auto: respuesta recibida via webchat.',
        requestId: args.requestId || null,
      });
    } catch {
      // ignore
    }
  }

  return msgId;
}

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'pending' | 'resolved';

export async function createOrReuseTicket(args: {
  conversationId: string;
  leadId?: string | null;
  customerId?: string | null;
  summary: string;
  priority?: TicketPriority;
  requestId?: string | null;
}): Promise<{ ticketId: string | null; reused: boolean }> {
  const admin = getSupabaseAdmin();

  const payload: TablesInsert<'tickets'> = {
    conversation_id: args.conversationId,
    lead_id: args.leadId ?? null,
    customer_id: args.customerId ?? null,
    summary: args.summary.slice(0, 2000),
    status: 'open',
    priority: (args.priority || 'normal') as TicketPriority,
  };

  const ins = await admin.from('tickets').insert(payload).select('id').single();

  if (!ins.error && ins.data?.id) {
    const ticketId = ins.data.id as string;

    void logEvent(
      'ticket.created',
      {
        requestId: args.requestId || null,
        conversationId: args.conversationId,
        ticketId,
        priority: payload.priority,
      },
      { source: 'crm', entityId: ticketId, dedupeKey: `ticket:created:${ticketId}` },
    );

    // Create an operational follow-up task (best-effort)
    try {
      const due = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const p = (payload.priority || 'normal') as TicketPriority;
      const taskPriority = (p === 'urgent' ? 'urgent' : p === 'high' ? 'high' : 'normal') as any;
      await createTask({
        ticketId,
        title: 'Responder ticket (SLA)'.slice(0, 200),
        priority: taskPriority,
        dueAt: due,
        requestId: args.requestId || null,
      });
    } catch {
      // ignore
    }

    // Auto-create/reuse a deal when we have contact info, to avoid losing leads.
    try {
      await bestEffortEnsureDealForTicket({
        leadId: args.leadId ?? null,
        customerId: args.customerId ?? null,
        summary: args.summary,
        ticketPriority: payload.priority as any,
        requestId: args.requestId || null,
      });
    } catch {
      // ignore
    }

    return { ticketId, reused: false };
  }

  const q = await admin
    .from('tickets')
    .select('id')
    .eq('conversation_id', args.conversationId)
    .in('status', ['open', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (q.data?.id) {
    const ticketId = q.data.id as string;

    void logEvent(
      'ticket.reused',
      { requestId: args.requestId || null, conversationId: args.conversationId, ticketId },
      { source: 'crm', entityId: ticketId, dedupeKey: `ticket:reused:${ticketId}` },
    );

    try {
      const patch: Partial<TablesInsert<'tickets'>> = {};
      if (args.leadId) patch.lead_id = args.leadId;
      if (args.customerId) patch.customer_id = args.customerId;
      if (Object.keys(patch).length > 0)
        await admin.from('tickets').update(patch).eq('id', ticketId);
    } catch {
      // ignore
    }

    return { ticketId, reused: true };
  }

  void logEvent(
    'api.error',
    {
      requestId: args.requestId || null,
      route: 'createOrReuseTicket',
      conversationId: args.conversationId,
      message: ins.error?.message || 'ticket insert failed',
    },
    { source: 'api' },
  );

  return { ticketId: null, reused: false };
}

// Stages aligned with /admin/deals/board
export type DealStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'checkout'
  | 'won'
  | 'lost';

function taskPriorityFromTicketPriority(p: TicketPriority | null | undefined): TaskPriority {
  const v = (p || 'normal') as TicketPriority;
  return (v === 'urgent' ? 'urgent' : v === 'high' ? 'high' : 'normal') as TaskPriority;
}

async function bestEffortEnsureDealForTicket(args: {
  leadId?: string | null;
  customerId?: string | null;
  summary: string;
  ticketPriority?: TicketPriority | null;
  requestId?: string | null;
}): Promise<string | null> {
  const admin = getSupabaseAdmin();
  const leadId = args.leadId || null;
  const customerId = args.customerId || null;

  // If we have no party, we can't create a meaningful deal.
  if (!leadId && !customerId) return null;

  // Reuse a recent active deal to avoid spam (last 7 days).
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const q = await (admin as any)
      .from('deals')
      .select('id,updated_at,stage')
      .or([leadId ? `lead_id.eq.${leadId}` : '', customerId ? `customer_id.eq.${customerId}` : '']
        .filter(Boolean)
        .join(','))
      .gte('updated_at', sevenDaysAgo)
      .not('stage', 'in', '("won","lost")')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!q?.error && q?.data?.id) return q.data.id as string;
  } catch {
    // ignore
  }

  const { dealId } = await createOrReuseDeal({
    leadId,
    customerId,
    tourSlug: null,
    title: (args.summary || 'Lead').slice(0, 180),
    stage: 'new',
    source: 'ticket',
    notes: 'Auto-creado desde ticket para seguimiento.',
    requestId: args.requestId || null,
  });

  if (!dealId) return null;

  // Create a follow-up task to not lose the lead.
  try {
    const due = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await createTask({
      dealId,
      title: 'Follow-up lead (24h)'.slice(0, 200),
      priority: taskPriorityFromTicketPriority(args.ticketPriority),
      dueAt: due,
      requestId: args.requestId || null,
    });
  } catch {
    // ignore
  }

  return dealId;
}

export async function createOrReuseDeal(args: {
  leadId?: string | null;
  customerId?: string | null;
  tourSlug?: string | null;
  title?: string | null;
  stage?: DealStage;
  amountMinor?: number | null;
  currency?: string | null;
  probability?: number | null;
  assignedTo?: string | null;
  source?: string | null;
  notes?: string | null;
  requestId?: string | null;
}): Promise<{ dealId: string | null; reused: boolean }> {
  const admin = getSupabaseAdmin();

  const leadId = args.leadId || null;
  const tourSlug = (args.tourSlug || '').trim() || null;

  const payload: TablesInsert<'deals'> = {
    lead_id: leadId,
    customer_id: args.customerId || null,
    tour_slug: tourSlug,
    title: (args.title || 'Tour booking').trim(),
    stage: (args.stage || 'new') as DealStage,
    amount_minor: typeof args.amountMinor === 'number' ? Math.trunc(args.amountMinor) : null,
    currency: (args.currency || 'eur').toLowerCase(),
    probability:
      typeof args.probability === 'number'
        ? Math.max(0, Math.min(100, Math.trunc(args.probability)))
        : 20,
    assigned_to: args.assignedTo || null,
    source: (args.source || 'chat').trim(),
    notes: args.notes || null,
  };

  const ins = await admin.from('deals').insert(payload).select('id').single();

  if (!ins.error && ins.data?.id) {
    const dealId = ins.data.id;

    void logEvent(
      'deal.created',
      { requestId: args.requestId || null, dealId, leadId, tourSlug, stage: payload.stage },
      { source: 'crm', entityId: dealId, dedupeKey: `deal:created:${dealId}` },
    );

    return { dealId, reused: false };
  }

  if (leadId && tourSlug) {
    const q = await admin
      .from('deals')
      .select('id')
      .eq('lead_id', leadId)
      .eq('tour_slug', tourSlug)
      .not('stage', 'in', '("won","lost")')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (q.data?.id) {
      const dealId = q.data.id as string;

      try {
        const patch: Partial<TablesInsert<'deals'>> = {};
        if (args.stage) patch.stage = args.stage;
        if (typeof args.amountMinor === 'number') patch.amount_minor = Math.trunc(args.amountMinor);
        if (typeof args.probability === 'number') {
          patch.probability = Math.max(0, Math.min(100, Math.trunc(args.probability)));
        }
        if (args.notes) patch.notes = args.notes;

        if (Object.keys(patch).length) await admin.from('deals').update(patch).eq('id', dealId);
      } catch {
        // ignore
      }

      void logEvent(
        'deal.reused',
        { requestId: args.requestId || null, dealId, leadId, tourSlug },
        { source: 'crm', entityId: dealId, dedupeKey: `deal:reused:${dealId}` },
      );

      return { dealId, reused: true };
    }
  }

  void logEvent(
    'api.error',
    {
      requestId: args.requestId || null,
      route: 'createOrReuseDeal',
      message: ins.error?.message || 'deal insert failed',
    },
    { source: 'api' },
  );

  return { dealId: null, reused: false };
}

export type TaskStatus = 'open' | 'in_progress' | 'done' | 'canceled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export async function createTask(args: {
  dealId?: string | null;
  ticketId?: string | null;
  title: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string | null;
  dueAt?: string | null;
  requestId?: string | null;
}): Promise<string | null> {
  const admin = getSupabaseAdmin();

  const ins = await admin
    .from('tasks')
    .insert({
      deal_id: args.dealId || null,
      ticket_id: args.ticketId || null,
      title: args.title.slice(0, 500),
      status: (args.status || 'open') as TaskStatus,
      priority: (args.priority || 'normal') as TaskPriority,
      assigned_to: args.assignedTo || null,
      due_at: args.dueAt || null,
    })
    .select('id')
    .single();

  if (ins.error || !ins.data?.id) {
    void logEvent(
      'api.error',
      {
        requestId: args.requestId || null,
        route: 'createTask',
        message: ins.error?.message || 'task insert failed',
      },
      { source: 'api' },
    );
    return null;
  }

  const taskId = ins.data.id;

  void logEvent(
    'task.created',
    {
      requestId: args.requestId || null,
      taskId,
      dealId: args.dealId || null,
      ticketId: args.ticketId || null,
    },
    { source: 'crm', entityId: taskId, dedupeKey: `task:created:${taskId}` },
  );

  return taskId;
}
