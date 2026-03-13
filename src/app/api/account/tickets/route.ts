import { NextResponse } from 'next/server';
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

export const runtime = 'nodejs';

const BodySchema = z.object({
  bookingId: z.string().uuid().optional(),
  subject: z.string().max(140).optional(),
  message: z.string().min(10).max(2000),
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

function bearer(headers: Headers): string | null {
  const h = headers.get('authorization') || headers.get('Authorization');
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

async function getLeadIdsForUser(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  user: { email?: string | null; user_metadata?: any },
) {
  const ids: string[] = [];
  const email = normalizeEmail(user.email || null);
  const phone = normalizePhone(user.user_metadata?.phone || null);

  try {
    if (email) {
      const q = await admin
        .from('leads')
        .select('id')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(10);

      const rows = (q.data as LeadIdRow[] | null) ?? [];
      if (!q.error) {
        for (const row of rows) if (row?.id) ids.push(row.id);
      }
    }

    if (phone) {
      const q = await admin
        .from('leads')
        .select('id')
        .eq('whatsapp', phone)
        .order('created_at', { ascending: false })
        .limit(10);

      const rows = (q.data as LeadIdRow[] | null) ?? [];
      if (!q.error) {
        for (const row of rows) if (row?.id && !ids.includes(row.id)) ids.push(row.id);
      }
    }
  } catch {
    // ignore
  }

  return ids;
}

export async function GET(req: Request) {
  const requestId = getRequestId(req.headers);

  try {
    const token = bearer(req.headers);
    if (!token) {
      return NextResponse.json({ error: 'unauthorized', requestId }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'admin_not_configured', requestId }, { status: 503 });
    }

    const userRes = await admin.auth.getUser(token);
    const user = userRes.data?.user;

    if (userRes.error || !user) {
      return NextResponse.json({ error: 'unauthorized', requestId }, { status: 401 });
    }

    const leadIds = await getLeadIdsForUser(admin, user);
    if (leadIds.length === 0) {
      return NextResponse.json({ ok: true, items: [], requestId }, { status: 200 });
    }

    const q = await admin
      .from('tickets')
      .select('id, summary, status, priority, created_at, last_message_at')
      .in('lead_id', leadIds)
      .order('last_message_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (q.error) {
      return NextResponse.json(
        { ok: false, error: 'db_error', message: q.error.message, requestId },
        { status: 500 },
      );
    }

    const items = ((q.data as TicketListRow[] | null) ?? []).map((t) => ({
      id: t.id,
      summary: t.summary ?? null,
      status: t.status ?? null,
      priority: t.priority ?? null,
      created_at: t.created_at ?? null,
      last_message_at: t.last_message_at ?? null,
    }));

    return NextResponse.json({ ok: true, items, requestId }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'server_error', message: String(err?.message || err), requestId },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const requestId = getRequestId(req.headers);

  try {
    const token = bearer(req.headers);
    if (!token) {
      return NextResponse.json({ error: 'unauthorized', requestId }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'admin_not_configured', requestId }, { status: 503 });
    }

    const userRes = await admin.auth.getUser(token);
    const user = userRes.data?.user;

    if (userRes.error || !user) {
      return NextResponse.json({ error: 'unauthorized', requestId }, { status: 401 });
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'bad_request', issues: parsed.error.issues, requestId },
        { status: 400 },
      );
    }

    const { bookingId, subject, message } = parsed.data;

    let booking: BookingRow | null = null;
    if (bookingId) {
      const b = await admin
        .from('bookings')
        .select('id, user_id, stripe_session_id, tour_id, customer_email, customer_name, phone, date, persons')
        .eq('id', bookingId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!b.error && b.data) booking = (b.data as BookingRow) ?? null;
    }

    const email = (user.email || booking?.customer_email || null) as string | null;
    const whatsapp =
      (booking?.phone || (user.user_metadata as any)?.phone || null) as string | null;

    const leadId = await ensureLead({
      email,
      whatsapp,
      source: 'account',
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

    const bookingLine = booking?.id ? `Booking: ${booking.id}` : '';
    const summaryBase = (subject || 'Soporte desde Cuenta').trim();
    const summary = bookingLine ? `${summaryBase} (${bookingLine})` : summaryBase;

    const { ticketId } = await createOrReuseTicket({
      conversationId,
      leadId,
      customerId: null,
      summary,
      priority: 'normal',
      requestId,
    });

    const contentParts: string[] = [];
    contentParts.push(message.trim());

    if (booking?.id) {
      contentParts.push('');
      contentParts.push('---');
      contentParts.push('Contexto de reserva');
      contentParts.push(`• booking_id: ${booking.id}`);
      if (booking.stripe_session_id) contentParts.push(`• stripe_session_id: ${booking.stripe_session_id}`);
      if (booking.tour_id) contentParts.push(`• tour_id: ${booking.tour_id}`);
      if (booking.date) contentParts.push(`• date: ${booking.date}`);
      if (booking.persons) contentParts.push(`• persons: ${booking.persons}`);
    }

    await appendMessage({
      conversationId,
      role: 'user',
      content: contentParts.join('\n'),
      meta: {
        requestId,
        ticketId,
        bookingId: booking?.id || null,
        from: 'account',
      },
      requestId,
    });

    // best-effort: set lead_id in the ticket if it was created without it
    try {
      if (ticketId && leadId) {
        await (admin as any).from('tickets').update({ lead_id: leadId }).eq('id', ticketId);
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ ok: true, ticketId, conversationId, requestId }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'server_error', message: String(err?.message || err), requestId },
      { status: 500 },
    );
  }
}
