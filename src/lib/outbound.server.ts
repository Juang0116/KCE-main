import 'server-only';

import { Resend } from 'resend';

import { serverEnv } from '@/lib/env';
import { getChannelPause } from '@/lib/channelPause.server';
import { logEvent } from '@/lib/events.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { assertOpsNotPaused } from '@/lib/opsCircuitBreaker.server';

export type OutboundChannel = 'whatsapp' | 'email';
export type OutboundStatus = 'draft' | 'queued' | 'sending' | 'sent' | 'failed' | 'canceled';

export type OutboundRow = {
  id: string;
  deal_id: string | null;
  ticket_id: string | null;
  lead_id: string | null;
  customer_id: string | null;

  channel: OutboundChannel;
  provider: string;
  status: OutboundStatus;

  to_email: string | null;
  to_phone: string | null;

  subject: string | null;
  body: string;

  template_key: string | null;
  template_variant: string | null;

  error: string | null;
  metadata: any;

  created_at: string;
  updated_at: string;
  sent_at: string | null;

  outcome: 'none' | 'replied' | 'paid' | 'lost';
  replied_at: string | null;
  replied_note: string | null;
  attributed_won_at: string | null;
  attributed_booking_id: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

function must(v: string | undefined, name: string): string {
  if (!v || !v.trim()) throw new Error(`[outbound] Missing env: ${name}`);
  return v.trim();
}

export async function createOutboundMessage(params: {
  channel: OutboundChannel;
  provider?: string;
  status?: OutboundStatus;
  toEmail?: string | null;
  toPhone?: string | null;
  subject?: string | null;
  body: string;

  dealId?: string | null;
  ticketId?: string | null;
  leadId?: string | null;
  customerId?: string | null;

  templateKey?: string | null;
  templateVariant?: string | null;
  metadata?: Record<string, any>;
}): Promise<OutboundRow> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin not configured');

  const insert = {
    channel: params.channel,
    provider: params.provider ?? 'manual',
    status: params.status ?? 'queued',
    to_email: params.toEmail ?? null,
    to_phone: params.toPhone ?? null,
    subject: params.subject ?? null,
    body: params.body,
    deal_id: params.dealId ?? null,
    ticket_id: params.ticketId ?? null,
    lead_id: params.leadId ?? null,
    customer_id: params.customerId ?? null,
    template_key: params.templateKey ?? null,
    template_variant: params.templateVariant ?? null,
    metadata: params.metadata ?? {},
  };

  const res = await admin
    .from('crm_outbound_messages')
    .insert(insert as any)
    .select('*')
    .limit(1)
    .maybeSingle();

  if (res.error || !res.data) throw new Error(res.error?.message || 'Failed to create outbound message');

  await logEvent(
    'crm.outbound.queued',
    {
      messageId: res.data.id,
      channel: res.data.channel,
      provider: res.data.provider,
      status: res.data.status,
      dealId: res.data.deal_id,
      ticketId: res.data.ticket_id,
      toEmail: res.data.to_email,
      toPhone: res.data.to_phone,
      templateKey: res.data.template_key,
      templateVariant: res.data.template_variant,
    },
    { source: 'crm', entityId: res.data.id, dedupeKey: null },
  );

  return res.data as any;
}

export async function listOutboundMessages(params: {
  status?: OutboundStatus | null;
  dealId?: string | null;
  ticketId?: string | null;
  q?: string | null;
  limit?: number;
}): Promise<OutboundRow[]> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin not configured');

  const limit = Math.min(Math.max(params.limit ?? 200, 1), 500);
  let q = admin
    .from('crm_outbound_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (params.status) q = q.eq('status', params.status);
  if (params.dealId) q = q.eq('deal_id', params.dealId);
  if (params.ticketId) q = q.eq('ticket_id', params.ticketId);
  if (params.q && params.q.trim()) {
    const term = params.q.trim();
    // best-effort ilike across body/to_email/to_phone
    q = q.or(`body.ilike.%${term}%,to_email.ilike.%${term}%,to_phone.ilike.%${term}%`);
  }

  const res = await q;
  if (res.error) throw new Error(res.error.message);
  return (res.data || []) as any;
}

export async function updateOutboundStatus(id: string, patch: Partial<Pick<OutboundRow, 'status' | 'error' | 'provider'>> & { sent_at?: string | null }): Promise<OutboundRow> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin not configured');

  const upd: any = {
    ...('status' in patch ? { status: patch.status } : {}),
    ...('error' in patch ? { error: patch.error } : {}),
    ...('provider' in patch ? { provider: patch.provider } : {}),
    ...('sent_at' in patch ? { sent_at: patch.sent_at } : {}),
  };

  const res = await admin.from('crm_outbound_messages').update(upd).eq('id', id).select('*').maybeSingle();
  if (res.error || !res.data) throw new Error(res.error?.message || 'Failed to update outbound message');
  return res.data as any;
}

export async function markOutboundReplied(id: string, note: string | null = null): Promise<OutboundRow> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin not configured');

  const upd: any = { outcome: 'replied', replied_at: nowIso() };
  if (note && note.trim()) upd.replied_note = note.trim();

  const res = await admin
    .from('crm_outbound_messages')
    .update(upd)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (res.error || !res.data) throw new Error(res.error?.message || 'Failed to mark replied');

  await logEvent(
    'crm.outbound.replied',
    { messageId: id, dealId: res.data.deal_id, ticketId: res.data.ticket_id, channel: res.data.channel },
    { source: 'crm', entityId: id, dedupeKey: null },
  );

  return res.data as any;
}

export async function markOutboundLost(id: string, note: string | null = null): Promise<OutboundRow> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin not configured');

  const upd: any = { outcome: 'lost' };
  if (note && note.trim()) upd.replied_note = note.trim();

  const res = await admin
    .from('crm_outbound_messages')
    .update(upd)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (res.error || !res.data) throw new Error(res.error?.message || 'Failed to mark lost');

  await logEvent(
    'crm.outbound.lost',
    { messageId: id, dealId: res.data.deal_id, ticketId: res.data.ticket_id, channel: res.data.channel },
    { source: 'crm', entityId: id, dedupeKey: null },
  );

  return res.data as any;
}

export async function attributeOutboundPaid(params: { dealId: string; bookingId: string | null; windowDays?: number; requestId?: string | null }) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin not configured');

  const windowDays = Math.min(Math.max(params.windowDays ?? 7, 1), 30);
  const since = new Date(Date.now() - windowDays * 24 * 3600 * 1000).toISOString();

  const r = await admin
    .from('crm_outbound_messages')
    .select('id,template_key,template_variant,channel,status,sent_at')
    .eq('deal_id', params.dealId)
    .eq('status', 'sent')
    .gte('sent_at', since)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (r.error || !r.data) return null;

  const upd: any = { outcome: 'paid', attributed_won_at: nowIso() };
  if (params.bookingId) upd.attributed_booking_id = params.bookingId;

  const u = await admin.from('crm_outbound_messages').update(upd).eq('id', r.data.id).select('*').maybeSingle();
  if (u.error || !u.data) return null;

  await logEvent(
    'crm.outbound.attributed_paid',
    { dealId: params.dealId, bookingId: params.bookingId, messageId: r.data.id, templateKey: r.data.template_key, templateVariant: r.data.template_variant, channel: r.data.channel, requestId: params.requestId || null },
    { source: 'crm', entityId: r.data.id, dedupeKey: null },
  );

  return u.data as any;
}

export async function sendOutboundEmail(message: OutboundRow): Promise<void> {
  // Ops circuit breaker: allow Ops to temporarily pause email sending to prevent cascading failures.
  // We don't have the original request here; synthesize a minimal NextRequest-like object is not worth it.
  // Instead, fail fast with a clear error message.
  const paused = await (async () => {
    try {
      // Create a minimal object to satisfy the helper without tying to ...
      // (assertOpsNotPaused only uses headers + DB, so a dummy works.)
      const dummy: any = { headers: new Headers(), nextUrl: { pathname: 'outbound.email' }, method: 'POST' };
      const r = await assertOpsNotPaused(dummy as any, 'email');
      return r.ok ? null : r;
    } catch {
      return null;
    }
  })();
  if (paused) {
    throw new Error(`Email sending temporarily paused${paused.reason ? `: ${paused.reason}` : ''}`);
  }

  const apiKey = must(serverEnv.RESEND_API_KEY, 'RESEND_API_KEY');
  const from = must(serverEnv.EMAIL_FROM, 'EMAIL_FROM');
  const replyTo = (serverEnv.EMAIL_REPLY_TO || '').trim() || undefined;

  if (!message.to_email) throw new Error('Missing to_email');
  const subject = (message.subject || 'KCE').trim();
  const html = `<div style="font-family: ui-sans-serif, system-ui, -apple-system; line-height:1.5; white-space:pre-wrap">${escapeHtml(
    message.body || '',
  )}</div>`;

  const resend = new Resend(apiKey);

  const args: any = {
    from,
    to: [message.to_email],
    subject,
    html,
  };
  if (replyTo) args.replyTo = replyTo;

  const out = await resend.emails.send(args);
  if ((out as any)?.error) throw new Error((out as any).error.message || 'Resend error');

  await logEvent(
    'crm.outbound.sent',
    { messageId: message.id, channel: 'email', to: message.to_email, provider: 'resend' },
    { source: 'crm', entityId: message.id, dedupeKey: null },
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] as string));
}

export function buildWhatsAppLink(phoneDigits: string, body: string): string {
  const digits = (phoneDigits || '').replace(/\D+/g, '');
  const text = encodeURIComponent(body || '');
  return `https://wa.me/${digits}?text=${text}`;
}

export async function processOutboundQueue(params: { limit?: number; dryRun?: boolean; requestId?: string | null } = {}): Promise<{ processed: number; sent: number; failed: number }> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin not configured');

  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);

  const res = await admin
    .from('crm_outbound_messages')
    .select('*')
    .eq('status', 'queued')
    .eq('channel', 'email')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (res.error) throw new Error(res.error.message);

    const pause = params.dryRun ? null : await getChannelPause('email');
let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const row of (res.data || []) as any[]) {
    processed++;
    if (params.dryRun) continue;

if (pause && pause.paused_until) {
  await updateOutboundStatus(row.id, { status: 'canceled', error: `Paused until ${pause.paused_until}: ${pause.reason || 'channel paused'}` });
  await logEvent('outbound.paused', { id: row.id, channel: 'email', paused_until: pause.paused_until, reason: pause.reason || null });
  continue;
}

    try {
      await updateOutboundStatus(row.id, { status: 'sending', error: null, provider: 'resend' });
      await sendOutboundEmail(row as any);
      await updateOutboundStatus(row.id, { status: 'sent', sent_at: nowIso(), provider: 'resend', error: null });
      sent++;
    } catch (e: any) {
      const msg = String(e?.message || 'Send failed');
      await updateOutboundStatus(row.id, { status: 'failed', error: msg, provider: row.provider || 'resend' });
      failed++;
      await logEvent(
        'crm.outbound.failed',
        { messageId: row.id, channel: 'email', error: msg },
        { source: 'crm', entityId: row.id, dedupeKey: null },
      );
    }
  }

  return { processed, sent, failed };
}
