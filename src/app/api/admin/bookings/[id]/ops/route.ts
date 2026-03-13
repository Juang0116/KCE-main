import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import {
  appendMessage,
  createOrReuseTicket,
  ensureConversation,
  ensureLead,
} from '@/lib/botStorage.server';
import { logEvent } from '@/lib/events.server';
import { buildWhatsAppLink, createOutboundMessage } from '@/lib/outbound.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { renderCrmTemplate } from '@/lib/templates.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z
  .object({
    action: z.enum([
      'cancel',
      'reschedule',
      'refund',
      'note',
      'ticket',
      'outbound_email',
      'outbound_whatsapp',
    ]),
    reason: z.string().max(4000).optional().nullable(),
    desiredDate: z.string().optional().nullable(),
    note: z.string().max(8000).optional().nullable(),
    templateKey: z.string().max(200).optional().nullable(),
  })
  .strict();

function baseUrl(req: NextRequest) {
  const h = req.headers;
  const proto = h.get('x-forwarded-proto') || 'https';
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  return `${proto}://${host}`;
}

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, ctx: Ctx) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const id = ctx.params?.id;
  if (!id) {
    return NextResponse.json(
      { ok: false, error: 'Missing booking id', requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const bodyJson = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Bad body', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Supabase admin not configured', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  // ✅ Cast a any to avoid "never" while Database typing is not wired.
  const bRes = await (admin as any)
    .from('bookings')
    .select(
      'id,user_id,tour_id,date,persons,customer_name,customer_email,phone,status,deal_id,created_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (bRes.error || !bRes.data) {
    return NextResponse.json(
      { ok: false, error: bRes.error?.message || 'Booking not found', requestId },
      { status: 404, headers: withRequestId(undefined, requestId) },
    );
  }

  const booking = bRes.data as any;

  let tourTitle = 'tu tour';
  try {
    const tRes = await (admin as any)
      .from('tours')
      .select('title')
      .eq('id', booking.tour_id)
      .maybeSingle();

    if (!tRes.error && tRes.data?.title) tourTitle = String(tRes.data.title);
  } catch {
    // ignore
  }

  const name =
    (booking.customer_name || '').trim() ||
    (booking.customer_email || '').trim() ||
    'Cliente';

  const supportUrl = `${baseUrl(req)}/account/support?booking=${encodeURIComponent(
    booking.id,
  )}`;

  // Ensure lead + conversation for CRM linkage (best-effort)
  const leadId = await ensureLead({
    email: booking.customer_email || null,
    whatsapp: booking.phone || null,
    source: 'ops',
    language: 'es',
    consent: true,
    requestId,
  });

  const conversationId = await ensureConversation({
    leadId: leadId || null,
    customerId: null,
    channel: 'webchat',
    language: 'es',
    requestId,
  });

  // Ticket is optional, but most ops actions should create one so everything is traceable.
  let ticketId: string | null = null;
  if (parsed.data.action !== 'note') {
    const summaryBase = `Ops: ${parsed.data.action} | Booking ${booking.id} | ${tourTitle}`;
    const ticket = await createOrReuseTicket({
      conversationId,
      leadId: leadId || null,
      customerId: null,
      summary: summaryBase,
      priority: parsed.data.action === 'refund' ? 'high' : 'normal',
      requestId,
    });
    ticketId = ticket.ticketId;
  }

  const nowIso = new Date().toISOString();
  const patch: Record<string, any> = {};

  if (parsed.data.action === 'cancel') {
    patch.cancel_requested_at = nowIso;
    patch.cancel_requested_reason = parsed.data.reason || null;
  } else if (parsed.data.action === 'reschedule') {
    patch.reschedule_requested_at = nowIso;
    patch.reschedule_requested_to = parsed.data.desiredDate || null;
  } else if (parsed.data.action === 'refund') {
    patch.refund_requested_at = nowIso;
  } else if (parsed.data.action === 'note') {
    patch.ops_notes = parsed.data.note || null;
  }

  if (Object.keys(patch).length > 0) {
    // ✅ avoid "never" until Database types are wired
    await (admin as any).from('bookings').update(patch).eq('id', booking.id);
  }

  // Append internal note into the conversation (best-effort)
  try {
    const lines = [
      `[OPS] ${parsed.data.action.toUpperCase()} — Booking ${booking.id}`,
      `Tour: ${tourTitle}`,
      `Customer: ${name} (${booking.customer_email || 'no-email'})`,
      parsed.data.reason ? `Reason: ${parsed.data.reason}` : null,
      parsed.data.desiredDate ? `Desired date: ${parsed.data.desiredDate}` : null,
      parsed.data.note ? `Note: ${parsed.data.note}` : null,
    ].filter(Boolean) as string[];

    await appendMessage({
      conversationId,
      role: 'agent',
      // ✅ FIX: correct newline join (was breaking your file)
      content: lines.join('\n'),
      meta: { bookingId: booking.id, action: parsed.data.action },
      requestId,
    });
  } catch {
    // ignore
  }

  // Optional outbound (email/whatsapp)
  let outbound: any = null;
  let whatsappLink: string | null = null;

  if (
    parsed.data.action === 'outbound_email' ||
    parsed.data.action === 'outbound_whatsapp'
  ) {
    const channel = parsed.data.action === 'outbound_email' ? 'email' : 'whatsapp';

    const key =
      parsed.data.templateKey ||
      (channel === 'email' ? 'booking.ops.ack_reschedule' : 'booking.ops.ack_reschedule');

    const tpl = await renderCrmTemplate({
      key,
      locale: 'es',
      channel: channel as any,
      vars: {
        name,
        tour: tourTitle,
        booking_id: booking.id,
        booking_date: booking.date || '',
        support_url: supportUrl,
      },
      seed: booking.id,
    });

    outbound = await createOutboundMessage({
      channel: channel as any,
      toEmail: channel === 'email' ? booking.customer_email || null : null,
      toPhone: channel === 'whatsapp' ? booking.phone || null : null,
      subject: tpl.subject || null,
      body: tpl.body,
      dealId: booking.deal_id || null,
      ticketId,
      leadId: leadId || null,
      templateKey: key,
      templateVariant: tpl.templateVariant || null,
      metadata: {
        requestId,
        locale: 'es',
        bookingId: booking.id,
        tour: tourTitle,
      },
    });

    if (channel === 'whatsapp' && booking.phone) {
      whatsappLink = buildWhatsAppLink(String(booking.phone), tpl.body);
    }
  }

  await logEvent('ops.booking_action', {
    requestId,
    bookingId: booking.id,
    action: parsed.data.action,
    ticketId,
    outboundId: outbound?.id || null,
  });

  return NextResponse.json(
    { ok: true, requestId, bookingId: booking.id, ticketId, outbound, whatsappLink },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
