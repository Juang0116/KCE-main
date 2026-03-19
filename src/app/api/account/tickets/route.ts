import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import {
  appendMessage,
  createOrReuseTicket,
  ensureConversation,
  ensureLead,
} from '@/lib/botStorage.server';
import { getRequestId } from '@/lib/requestId';
import { normalizeEmail, normalizePhone } from '@/lib/normalize';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';

const BodySchema = z.object({
  bookingId: z.string().uuid().optional(),
  subject: z.string().max(140).optional(),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres").max(2000),
});

type LeadIdRow = { id: string };

type TicketListRow = {
  id: string;
  summary: string | null;
  status: string | null;
  priority: string | null;
  created_at: string | null;
  last_message_at: string | null;
};

type BookingRow = {
  id: string;
  user_id: string | null;
  stripe_session_id: string | null;
  tour_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  phone: string | null;
  date: string | null;
  persons: number | null;
};

/**
 * Extrae el Bearer token de forma segura
 */
function bearer(headers: Headers): string | null {
  const h = headers.get('authorization') || headers.get('Authorization');
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

/**
 * Resuelve todos los IDs de lead posibles para un usuario autenticado
 */
async function getLeadIdsForUser(admin: any, user: any): Promise<string[]> {
  const ids = new Set<string>();
  const email = normalizeEmail(user.email ?? '');
  const phone = normalizePhone(user.user_metadata?.phone ?? '');

  if (email) {
    const { data } = await admin.from('leads').select('id').eq('email', email).limit(10);
    data?.forEach((r: any) => r.id && ids.add(r.id));
  }
  if (phone) {
    const { data } = await admin.from('leads').select('id').eq('whatsapp', phone).limit(10);
    data?.forEach((r: any) => r.id && ids.add(r.id));
  }
  return Array.from(ids);
}

// --- GET: Listar tickets del usuario ---
export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();
  const token = bearer(req.headers);

  if (!token || !admin) {
    return NextResponse.json({ error: 'unauthorized', requestId }, { status: 401 });
  }

  try {
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'unauthorized', requestId }, { status: 401 });

    const leadIds = await getLeadIdsForUser(admin, user);
    if (leadIds.length === 0) {
      return NextResponse.json({ ok: true, items: [], requestId });
    }

    const { data, error } = await admin
      .from('tickets')
      .select('id, summary, status, priority, created_at, last_message_at')
      .in('lead_id', leadIds)
      .order('last_message_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ ok: true, items: data || [], requestId });
  } catch (err: any) {
    return NextResponse.json({ error: 'server_error', requestId }, { status: 500 });
  }
}

// --- POST: Crear nuevo ticket con contexto ---
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();
  const token = bearer(req.headers);

  if (!token || !admin) {
    return NextResponse.json({ error: 'unauthorized', requestId }, { status: 401 });
  }

  try {
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'unauthorized', requestId }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'bad_request', issues: parsed.error.issues, requestId }, { status: 400 });
    }

    const { bookingId, subject, message } = parsed.data;

    // 1. Opcional: Obtener contexto de reserva
    let booking: BookingRow | null = null;
    if (bookingId) {
      const { data } = await admin
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) booking = data as BookingRow;
    }

    // 2. Asegurar Lead y Conversación
    const email = (user.email || booking?.customer_email || null);
    const whatsapp = (booking?.phone || (user.user_metadata as any)?.phone || null);

    const leadId = await ensureLead({
      email,
      whatsapp,
      source: 'account_portal',
      language: 'es',
      consent: true,
      requestId,
    });

    const conversationId = await ensureConversation({
      leadId,
      customerId: null,
      channel: 'webchat',
      language: 'es',
      requestId,
    });

    // 3. Crear Ticket con Resumen Inteligente
    const summaryBase = (subject || 'Consulta de Soporte').trim();
    const summary = booking ? `${summaryBase} (Ref: ${booking.id.slice(0, 8)})` : summaryBase;

    const { ticketId } = await createOrReuseTicket({
      conversationId,
      leadId,
      customerId: null,
      summary,
      priority: 'normal',
      requestId,
    });

    // 4. Construir mensaje con metadatos de reserva
    const contentParts = [message.trim()];
    if (booking) {
      contentParts.push(
        '\n---\n📌 Datos de Reserva Adjuntos:',
        `• ID: ${booking.id}`,
        `• Tour: ${booking.tour_id ?? 'N/A'}`,
        `• Fecha: ${booking.date ?? 'N/A'}`,
        `• Personas: ${booking.persons ?? 0}`
      );
    }

    await appendMessage({
      conversationId,
      role: 'user',
      content: contentParts.join('\n'),
      meta: { requestId, ticketId, bookingId: booking?.id || null, from: 'account' },
      requestId,
    });

    // Log de auditoría
    void logEvent('support.ticket_created', { ticketId, bookingId: booking?.id }, { userId: user.id });

    return NextResponse.json({ ok: true, ticketId, conversationId, requestId });
  } catch (err: any) {
    return NextResponse.json({ error: 'server_error', message: err.message, requestId }, { status: 500 });
  }
}