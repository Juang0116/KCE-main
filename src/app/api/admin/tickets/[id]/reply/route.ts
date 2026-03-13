// src/app/api/admin/tickets/[id]/reply/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });

const BodySchema = z
  .object({
    content: z.string().trim().min(1).max(10_000),
    close: z.boolean().optional().default(false),
  })
  .strict();

function supabaseErr(e: any) {
  return { message: e?.message, details: e?.details, hint: e?.hint, code: e?.code };
}

/**
 * conversations.channel CHECK: ['web','whatsapp','email','chat']
 * tickets.channel CHECK: ['chat','email','whatsapp','web','phone','other']
 */
function mapTicketChannelToConversationChannel(
  channel: string | null | undefined,
): 'web' | 'whatsapp' | 'email' | 'chat' {
  const c = String(channel ?? '').toLowerCase();
  if (c === 'web') return 'web';
  if (c === 'whatsapp') return 'whatsapp';
  if (c === 'email') return 'email';
  if (c === 'chat') return 'chat';
  return 'chat';
}

/**
 * conversations.locale CHECK: ['es','en','fr','de']
 */
function normalizeLocale(v: string | null | undefined): 'es' | 'en' | 'fr' | 'de' {
  const s = String(v ?? '').toLowerCase().trim();
  if (s === 'en' || s.startsWith('en')) return 'en';
  if (s === 'fr' || s.startsWith('fr')) return 'fr';
  if (s === 'de' || s.startsWith('de')) return 'de';
  return 'es';
}

const STAGE_ORDER: Record<string, number> = {
  new: 0,
  contacted: 1,
  qualified: 2,
  proposal: 3,
  checkout: 4,
  won: 5,
  lost: 5,
};

function maxStage(current: string | null | undefined, desired: string): string {
  const c = String(current || '').toLowerCase();
  const d = String(desired || '').toLowerCase();
  const co = STAGE_ORDER[c] ?? 0;
  const doo = STAGE_ORDER[d] ?? 0;
  return doo > co ? d : c || d;
}

function inferDesiredStageFromAgentReply(content: string): 'contacted' | 'proposal' | 'checkout' {
  const s = String(content || '').toLowerCase();

  const hasUrl = /https?:\/\//.test(s) || /\bwww\./.test(s);
  const looksPayment =
    /\bcheckout\b/.test(s) ||
    /\bstripe\b/.test(s) ||
    /\bpagar\b/.test(s) ||
    /\bpayment\b/.test(s) ||
    /\bpay\b/.test(s);

  if (hasUrl && looksPayment) return 'checkout';
  if (/\bpropuesta\b/.test(s) || /\bproposal\b/.test(s) || /\bitinerario\b/.test(s)) return 'proposal';
  if (hasUrl) return 'proposal';
  return 'contacted';
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  // ✅ FIX: Supabase types desalineados -> evitar `never`
  const admin = getSupabaseAdmin() as any;
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Supabase admin not configured', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) },
    );
  }

  // Parse params + body fuera del try principal para que existan siempre
  const { id } = ParamsSchema.parse(await ctx.params);

  const bodyJson = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const { content, close } = parsed.data;
  const now = new Date().toISOString();

  try {
    // 1) Leer ticket
    const t = await admin
      .from('tickets')
      .select('id, conversation_id, status, channel, lead_id, customer_id')
      .eq('id', id)
      .maybeSingle();

    if (t.error) {
      return NextResponse.json(
        { ok: false, error: t.error.message, supabase: supabaseErr(t.error), requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }
    if (!t.data) {
      return NextResponse.json(
        { ok: false, error: 'Ticket not found', requestId },
        { status: 404, headers: withRequestId(undefined, requestId) },
      );
    }

    const leadId: string | null = t.data.lead_id ?? null;
    const customerId: string | null = t.data.customer_id ?? null;

    // 2) Garantizar conversation_id
    let conversationId = String(t.data.conversation_id ?? '').trim();

    if (!conversationId) {
      // (best-effort) tomar idioma del lead
      let leadLanguage: string | null = null;
      if (leadId) {
        const lead = await admin.from('leads').select('language').eq('id', leadId).maybeSingle();
        if (!lead.error) leadLanguage = (lead.data?.language as string | null) ?? null;
      }

      const convIns = await admin
        .from('conversations')
        .insert({
          lead_id: leadId,
          customer_id: customerId,
          locale: normalizeLocale(leadLanguage),
          channel: mapTicketChannelToConversationChannel(t.data.channel),
          status: 'open',
        })
        .select('id')
        .single();

      if (convIns.error || !convIns.data?.id) {
        await logEvent(
          'api.error',
          {
            requestId,
            route: '/api/admin/tickets/[id]/reply create_conversation',
            supabase: supabaseErr(convIns.error),
            ticketId: id,
          },
          { source: 'api' },
        );
        return NextResponse.json(
          { ok: false, error: convIns.error?.message || 'Failed to create conversation', requestId },
          { status: 500, headers: withRequestId(undefined, requestId) },
        );
      }

      conversationId = convIns.data.id as string;

      // link ticket -> conversation
      const upTicketConv = await admin
        .from('tickets')
        .update({ conversation_id: conversationId, updated_at: now })
        .eq('id', id);

      if (upTicketConv.error) {
        await logEvent(
          'api.warn',
          {
            requestId,
            route: '/api/admin/tickets/[id]/reply link_ticket_conversation',
            supabase: supabaseErr(upTicketConv.error),
            ticketId: id,
            conversationId,
          },
          { source: 'api' },
        );
      }
    }

    // 3) Insertar mensaje
    const insMsg = await admin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content,
        meta: { source: 'admin.ticket_reply' },
      })
      .select('id, created_at')
      .single();

    if (insMsg.error || !insMsg.data?.id) {
      await logEvent(
        'api.error',
        {
          requestId,
          route: '/api/admin/tickets/[id]/reply insert_message',
          supabase: supabaseErr(insMsg.error),
          ticketId: id,
          conversationId,
        },
        { source: 'api' },
      );
      return NextResponse.json(
        { ok: false, error: insMsg.error?.message || 'Message insert failed', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    // 4) Actualizar ticket
    const nextStatus = close ? 'resolved' : 'in_progress';

    const upTicket = await admin
      .from('tickets')
      .update({
        status: nextStatus,
        last_message_at: now,
        updated_at: now,
        resolved_at: close ? now : null,
        closed_at: close ? now : null,
      })
      .eq('id', id);

    if (upTicket.error) {
      await logEvent(
        'api.warn',
        {
          requestId,
          route: '/api/admin/tickets/[id]/reply update_ticket',
          supabase: supabaseErr(upTicket.error),
          ticketId: id,
        },
        { source: 'api' },
      );
    }

    // 5) Actualizar conversación
    if (close) {
      const upConv = await admin
        .from('conversations')
        .update({ status: 'closed', closed_at: now, updated_at: now })
        .eq('id', conversationId);

      if (upConv.error) {
        await logEvent(
          'api.warn',
          {
            requestId,
            route: '/api/admin/tickets/[id]/reply update_conversation_close',
            supabase: supabaseErr(upConv.error),
            conversationId,
          },
          { source: 'api' },
        );
      }
    } else {
      // mantener open si el agente responde
      const upConv = await admin
        .from('conversations')
        .update({ status: 'open', closed_at: null, updated_at: now })
        .eq('id', conversationId);

      if (upConv.error) {
        await logEvent(
          'api.warn',
          {
            requestId,
            route: '/api/admin/tickets/[id]/reply update_conversation_open',
            supabase: supabaseErr(upConv.error),
            conversationId,
          },
          { source: 'api' },
        );
      }
    }

    // 6) Auto-advance deal stage (best-effort, NO rompe la respuesta)
    try {
      const desired = inferDesiredStageFromAgentReply(content);

      const ors: string[] = [];
      if (leadId) ors.push(`lead_id.eq.${leadId}`);
      if (customerId) ors.push(`customer_id.eq.${customerId}`);

      if (ors.length) {
        const dq = await admin
          .from('deals')
          .select('id,stage,updated_at')
          .or(ors.join(','))
          .not('stage', 'in', '(won,lost)')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!dq.error && dq.data?.id) {
          const current = String(dq.data.stage || 'new').toLowerCase();
          const next = maxStage(current, desired);

          if (next && next !== current) {
            const up = await admin.from('deals').update({ stage: next, updated_at: now }).eq('id', dq.data.id);

            if (!up.error) {
              await logEvent(
                'crm.deal_stage_auto_advanced',
                {
                  requestId,
                  dealId: dq.data.id,
                  from: current,
                  to: next,
                  source: 'admin.ticket_reply',
                  ticketId: id,
                },
                { source: 'crm', entityId: dq.data.id, dedupeKey: `deal:autoStage:${dq.data.id}:${now}` },
              );
            }
          }
        }
      }
    } catch {
      // best-effort
    }

    return NextResponse.json(
      {
        ok: true,
        ticketId: id,
        conversationId,
        messageId: insMsg.data.id,
        status: nextStatus,
        requestId,
      },
      { status: 201, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/tickets/[id]/reply',
        message: e instanceof Error ? e.message : 'unknown',
        ticketId: id,
      },
      { source: 'api' },
    );

    return NextResponse.json(
      { ok: false, error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
