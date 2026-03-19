import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { appendMessage } from '@/lib/botStorage.server';
import { normalizeEmail, normalizePhone } from '@/lib/normalize';
import { getRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';

const ReplySchema = z.object({
  message: z.string().min(2, "El mensaje es muy corto").max(2000),
});

/**
 * Obtiene todos los IDs de 'leads' asociados a un usuario por email o WhatsApp.
 */
async function getLeadIdsForUser(admin: any, user: any): Promise<string[]> {
  const ids = new Set<string>();
  const email = normalizeEmail(user.email ?? '');
  const phone = normalizePhone(user.user_metadata?.phone ?? '');

  if (email) {
    const { data } = await admin.from('leads').select('id').eq('email', email).limit(5);
    data?.forEach((r: any) => r.id && ids.add(r.id));
  }
  if (phone) {
    const { data } = await admin.from('leads').select('id').eq('whatsapp', phone).limit(5);
    data?.forEach((r: any) => r.id && ids.add(r.id));
  }
  return Array.from(ids);
}

// --- GET: Obtener detalle del ticket y mensajes ---
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const { id: ticketId } = await ctx.params;
  const admin = getSupabaseAdmin();

  const auth = req.headers.get('authorization');
  const token = auth?.toLowerCase().startsWith('bearer ') ? auth.slice(7) : null;

  if (!token || !admin) {
    return NextResponse.json({ error: 'unauthorized', requestId }, { status: 401 });
  }

  try {
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'unauthorized', requestId }, { status: 401 });

    const leadIds = await getLeadIdsForUser(admin, user);
    
    const { data: ticket, error: tErr } = await admin
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .maybeSingle();

    // --- SOLUCIÓN ERROR 2345 (Type Guard) ---
    // Validamos que el ticket exista y que tenga lead_id y conversation_id definidos
    if (!ticket || !ticket.lead_id || !ticket.conversation_id) {
      return NextResponse.json({ error: 'ticket_not_found', requestId }, { status: 404 });
    }

    // Ahora TS sabe que ticket.lead_id es string, permitiendo el uso de .includes()
    if (!leadIds.includes(ticket.lead_id)) {
      return NextResponse.json({ error: 'forbidden', requestId }, { status: 403 });
    }

    // Ahora TS sabe que ticket.conversation_id es string para el filtro .eq()
    const { data: messages } = await admin
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', ticket.conversation_id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      ok: true,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        summary: ticket.summary,
        created_at: ticket.created_at
      },
      messages: messages || [],
      requestId
    });

  } catch (err) {
    return NextResponse.json({ error: 'server_error', requestId }, { status: 500 });
  }
}

// --- POST: Responder a un ticket ---
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const { id: ticketId } = await ctx.params;
  const admin = getSupabaseAdmin();

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = ReplySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid_message' }, { status: 400 });

    const auth = req.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token || !admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const leadIds = await getLeadIdsForUser(admin, user);
    const { data: ticket } = await admin.from('tickets').select('conversation_id, lead_id').eq('id', ticketId).maybeSingle();

    // --- CORRECCIÓN DE SEGURIDAD Y TIPADO EN POST ---
    if (!ticket || !ticket.conversation_id || !ticket.lead_id) {
      return NextResponse.json({ error: 'invalid_ticket_state' }, { status: 400 });
    }

    if (!leadIds.includes(ticket.lead_id)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // Enviar mensaje al almacenamiento del bot
    await appendMessage({
      conversationId: ticket.conversation_id,
      role: 'user',
      content: parsed.data.message,
      meta: { ticketId, source: 'user_dashboard' },
      requestId
    });

    // Actualizar metadatos del ticket
    await admin.from('tickets')
      .update({ status: 'open', last_message_at: new Date().toISOString() })
      .eq('id', ticketId);

    void logEvent('support.ticket_replied', { ticketId }, { userId: user.id });

    return NextResponse.json({ ok: true, requestId });
  } catch (err) {
    return NextResponse.json({ error: 'error_sending_reply', requestId }, { status: 500 });
  }
}