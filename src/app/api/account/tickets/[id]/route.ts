import { NextResponse } from 'next/server';
import { z } from 'zod';

import { appendMessage } from '@/lib/botStorage.server';
import { normalizeEmail, normalizePhone } from '@/lib/normalize';
import { getRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';

const ReplySchema = z.object({
  message: z.string().min(2).max(2000),
});

type LeadIdRow = { id: string };

type TicketRow = {
  id: string;
  summary: string | null;
  status: string | null;
  priority: string | null;
  created_at: string | null;
  last_message_at: string | null;
  conversation_id: string | null;
  lead_id: string | null;
};

type TicketRowMini = {
  id: string;
  conversation_id: string | null;
  lead_id: string | null;
};

type MessageRow = {
  id: string;
  role: string;
  content: string;
  created_at: string;
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
      if (!q.error) for (const row of rows) if (row?.id) ids.push(row.id);
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
        for (const row of rows) {
          if (row?.id && !ids.includes(row.id)) ids.push(row.id);
        }
      }
    }
  } catch {
    // ignore
  }

  return ids;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const { id } = await ctx.params;

  try {
    const token = bearer(req.headers);
    if (!token) return NextResponse.json({ error: 'unauthorized', requestId }, { status: 401 });

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: 'admin_not_configured', requestId }, { status: 503 });

    const userRes = await admin.auth.getUser(token);
    const user = userRes.data?.user;
    if (userRes.error || !user) {
      return NextResponse.json({ error: 'unauthorized', requestId }, { status: 401 });
    }

    const leadIds = await getLeadIdsForUser(admin, user);
    if (leadIds.length === 0) {
      return NextResponse.json({ error: 'not_found', requestId }, { status: 404 });
    }

    const ticketQ = await admin
      .from('tickets')
      .select('id, summary, status, priority, created_at, last_message_at, conversation_id, lead_id')
      .eq('id', id)
      .maybeSingle();

    const ticket = (ticketQ.data as TicketRow | null) ?? null;

    if (ticketQ.error || !ticket) {
      return NextResponse.json({ error: 'not_found', requestId }, { status: 404 });
    }

    if (ticket.lead_id && !leadIds.includes(ticket.lead_id)) {
      return NextResponse.json({ error: 'forbidden', requestId }, { status: 403 });
    }

    const conversationId = ticket.conversation_id;

    let messages: MessageRow[] = [];
    if (conversationId) {
      const msgQ = await admin
        .from('messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(50);

      const rows = (msgQ.data as MessageRow[] | null) ?? [];
      if (!msgQ.error) messages = rows;
    }

    return NextResponse.json(
      {
        ok: true,
        ticket: {
          id: ticket.id,
          summary: ticket.summary ?? null,
          status: ticket.status ?? null,
          priority: ticket.priority ?? null,
          created_at: ticket.created_at ?? null,
          last_message_at: ticket.last_message_at ?? null,
        },
        messages,
        requestId,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'server_error', message: String(err?.message || err), requestId },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const { id } = await ctx.params;

  try {
    const token = bearer(req.headers);
    if (!token) return NextResponse.json({ error: 'unauthorized', requestId }, { status: 401 });

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: 'admin_not_configured', requestId }, { status: 503 });

    const userRes = await admin.auth.getUser(token);
    const user = userRes.data?.user;
    if (userRes.error || !user) {
      return NextResponse.json({ error: 'unauthorized', requestId }, { status: 401 });
    }

    const parsed = ReplySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'bad_request', issues: parsed.error.issues, requestId },
        { status: 400 },
      );
    }

    const leadIds = await getLeadIdsForUser(admin, user);
    if (leadIds.length === 0) {
      return NextResponse.json({ error: 'not_found', requestId }, { status: 404 });
    }

    const ticketQ = await admin
      .from('tickets')
      .select('id, conversation_id, lead_id')
      .eq('id', id)
      .maybeSingle();

    const ticket = (ticketQ.data as TicketRowMini | null) ?? null;

    if (ticketQ.error || !ticket) {
      return NextResponse.json({ error: 'not_found', requestId }, { status: 404 });
    }

    if (ticket.lead_id && !leadIds.includes(ticket.lead_id)) {
      return NextResponse.json({ error: 'forbidden', requestId }, { status: 403 });
    }

    const conversationId = ticket.conversation_id;
    if (!conversationId) {
      return NextResponse.json(
        { error: 'invalid_ticket', message: 'Ticket sin conversación', requestId },
        { status: 400 },
      );
    }

    await appendMessage({
      conversationId,
      role: 'user',
      content: parsed.data.message,
      meta: { requestId, ticketId: id, from: 'account' },
      requestId,
    });

    // best-effort update
    try {
  await (admin as any)
    .from('tickets')
    .update({ last_message_at: new Date().toISOString(), status: 'open' })
    .eq('id', id);
} catch {
  // ignore
}

    return NextResponse.json({ ok: true, requestId }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'server_error', message: String(err?.message || err), requestId },
      { status: 500 },
    );
  }
}
