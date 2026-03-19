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

const ActionSchema = z.object({
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
}).strict();

/**
 * Helper para obtener la URL base del sitio
 */
function getBaseUrl(req: NextRequest) {
  const h = req.headers;
  const proto = h.get('x-forwarded-proto') || 'https';
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  
  // 1. Seguridad: Solo administradores autorizados
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const { id: bookingId } = await ctx.params;
  const admin = getSupabaseAdmin();

  if (!admin) {
    return NextResponse.json({ error: 'Admin DB not configured', requestId }, { status: 503 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload inválido', details: parsed.error.flatten(), requestId }, { status: 400 });
    }

    // 2. Cargar datos de la reserva y el tour
    const { data: booking, error: bErr } = await (admin as any)
      .from('bookings')
      .select('id, user_id, tour_id, date, persons, customer_name, customer_email, phone, status, deal_id')
      .eq('id', bookingId)
      .maybeSingle();

    if (bErr || !booking) {
      return NextResponse.json({ error: 'Reserva no encontrada', requestId }, { status: 404 });
    }

    let tourTitle = 'tu tour';
    const { data: tour } = await (admin as any).from('tours').select('title').eq('id', booking.tour_id).maybeSingle();
    if (tour?.title) tourTitle = tour.title;

    // 3. Garantizar Lead y Conversación para trazabilidad CRM
    const leadId = await ensureLead({
      email: booking.customer_email,
      whatsapp: booking.phone,
      source: 'ops_action',
      language: 'es',
      requestId,
    });

    const conversationId = await ensureConversation({
      leadId,
      channel: 'webchat',
      language: 'es',
      requestId,
    });

    // 4. Crear Ticket de Soporte (Salvo para notas simples)
    let ticketId: string | null = null;
    if (parsed.data.action !== 'note') {
      const { ticketId: tid } = await createOrReuseTicket({
        conversationId,
        leadId,
        summary: `Ops: ${parsed.data.action.toUpperCase()} | ${tourTitle}`,
        priority: parsed.data.action === 'refund' ? 'high' : 'normal',
        requestId,
      });
      ticketId = tid;
    }

    // 5. Aplicar cambios a la Reserva
    const patch: Record<string, any> = {};
    const now = new Date().toISOString();

    if (parsed.data.action === 'cancel') {
      patch.cancel_requested_at = now;
      patch.cancel_requested_reason = parsed.data.reason;
    } else if (parsed.data.action === 'reschedule') {
      patch.reschedule_requested_at = now;
      patch.reschedule_requested_to = parsed.data.desiredDate;
    } else if (parsed.data.action === 'refund') {
      patch.refund_requested_at = now;
    } else if (parsed.data.action === 'note') {
      patch.ops_notes = parsed.data.note;
    }

    if (Object.keys(patch).length > 0) {
      await (admin as any).from('bookings').update(patch).eq('id', bookingId);
    }

    // 6. Notificación Interna en el Chat
    const lines = [
      `📌 [ACCION OPS] ${parsed.data.action.toUpperCase()}`,
      `Tour: ${tourTitle}`,
      parsed.data.reason ? `Motivo: ${parsed.data.reason}` : null,
      parsed.data.note ? `Nota: ${parsed.data.note}` : null,
    ].filter(Boolean) as string[];

    await appendMessage({
      conversationId,
      role: 'agent',
      content: lines.join('\n'),
      meta: { bookingId, action: parsed.data.action, ticketId },
      requestId,
    });

    // 7. Salida Opcional (Email/WhatsApp)
    let outbound = null;
    let whatsappLink = null;

    if (parsed.data.action.startsWith('outbound_')) {
      const channel = parsed.data.action === 'outbound_email' ? 'email' : 'whatsapp';
      const templateKey = parsed.data.templateKey || `booking.ops.ack_${parsed.data.action.split('_')[1]}`;

      const tpl = await renderCrmTemplate({
        key: templateKey,
        locale: 'es',
        channel: channel as any,
        vars: {
          name: booking.customer_name || 'Cliente',
          tour: tourTitle,
          booking_id: bookingId,
          support_url: `${getBaseUrl(req)}/account/support`,
        },
      });

      outbound = await createOutboundMessage({
        channel: channel as any,
        toEmail: booking.customer_email,
        toPhone: booking.phone,
        subject: tpl.subject,
        body: tpl.body,
        ticketId,
        leadId,
        metadata: { requestId, bookingId },
      });

      if (channel === 'whatsapp' && booking.phone) {
        whatsappLink = buildWhatsAppLink(booking.phone, tpl.body);
      }
    }

    // 8. Log de Auditoría (Corregido Error 2379)
    void logEvent(
      'ops.booking_action', 
      { bookingId, action: parsed.data.action, ticketId }, 
      { userId: auth.actor ?? null }
    );

    return NextResponse.json({
      ok: true,
      requestId,
      bookingId,
      ticketId,
      outbound,
      whatsappLink
    }, { status: 200, headers: withRequestId(undefined, requestId) });

  } catch (err: any) {
    return NextResponse.json({ error: 'Server error', message: err.message, requestId }, { status: 500 });
  }
}