// src/app/api/bot/create-ticket/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { jsonError, contentLengthBytes } from '@/lib/apiErrors';
import { assertAllowedOriginOrReferer } from '@/lib/requestGuards.server';
import {
  ensureLead,
  ensureConversation,
  appendMessage,
  createOrReuseTicket,
  createOrReuseDeal,
  createTask,
} from '@/lib/botStorage.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { verifyTurnstile } from '@/lib/turnstile.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function trimOrUndefined(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  const s = v.trim();
  return s ? s : undefined;
}

/**
 * IMPORTANT:
 * - z.preprocess(...) devuelve ZodEffects, y por eso NO puedes encadenar .max() después.
 * - La regla es: pon min/max en el schema interno, y luego envuélvelo con preprocess.
 */
const Text2000 = z.preprocess(trimOrUndefined, z.string().min(1).max(2000));
const OptText10000 = z.preprocess(trimOrUndefined, z.string().min(1).max(10_000)).optional();
const OptLocale = z.preprocess(trimOrUndefined, z.string().max(10)).optional();
const OptShort = z.preprocess(trimOrUndefined, z.string().min(1).max(120)).optional();
const OptArray40 = z.array(z.string().max(40)).max(12).optional();

const ChannelSchema = z.enum(['webchat', 'whatsapp', 'email']);

const LeadSchema = z
  .object({
    email: z.preprocess(trimOrUndefined, z.string().email()).optional(),
    whatsapp: z.preprocess(trimOrUndefined, z.string().min(6).max(40)).optional(),
    source: z.preprocess(trimOrUndefined, z.string().min(1).max(50)).optional(),
  })
  .optional();

const SalesContextSchema = z
  .object({
    city: OptShort,
    tour: OptShort,
    slug: OptShort,
    budget: OptShort,
    pace: OptShort,
    pax: z.coerce.number().int().min(1).max(20).optional(),
    interests: OptArray40,
    start: OptShort,
    end: OptShort,
    query: z.preprocess(trimOrUndefined, z.string().min(1).max(500)).optional(),
  })
  .optional();

const BodySchema = z
  .object({
    conversationId: z.string().uuid().optional(),
    channel: ChannelSchema.optional().default('webchat'),
    locale: OptLocale,

    // requerido por tu contrato
    consent: z.literal(true),
    turnstileToken: z.preprocess(trimOrUndefined, z.string().max(2048)).optional(),

    lead: LeadSchema,
    topic: z.preprocess(trimOrUndefined, z.string().min(1).max(40)).optional(),
    salesContext: SalesContextSchema,

    summary: Text2000,
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
    lastUserMessage: OptText10000,
  })
  .superRefine((v, ctx) => {
    const hasEmail = Boolean(v.lead?.email);
    const hasWhatsapp = Boolean(v.lead?.whatsapp);
    if (!hasEmail && !hasWhatsapp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes enviar email o whatsapp',
        path: ['lead'],
      });
    }
  });


type Body = z.infer<typeof BodySchema>;

function shouldCreateCommercialFollowUp(data: Body) {
  const topic = String(data.topic || '').toLowerCase();
  const source = String(data.lead?.source || '').toLowerCase();
  if (['support', 'invoice', 'ticket'].includes(topic)) return false;
  if (['plan', 'tour', 'catalog', 'booking', 'chat'].includes(topic)) return true;
  if (source.includes('plan') || source.includes('tour') || source.includes('chat') || source.includes('contact')) return true;
  return false;
}

function buildDealTitle(data: Body) {
  const city = data.salesContext?.city?.trim() || '';
  const tour = data.salesContext?.tour?.trim() || '';
  const topic = String(data.topic || '').trim();
  const focus = tour || city || topic || 'KCE inquiry';
  return `Contacto · ${focus}`.slice(0, 180);
}

function buildDealNotes(data: Body) {
  return [
    data.topic ? `Topic: ${data.topic}` : null,
    data.salesContext?.city ? `Ciudad base: ${data.salesContext.city}` : null,
    data.salesContext?.tour ? `Tour: ${data.salesContext.tour}` : null,
    data.salesContext?.slug ? `Slug: ${data.salesContext.slug}` : null,
    data.salesContext?.budget ? `Presupuesto: ${data.salesContext.budget}` : null,
    data.salesContext?.pace ? `Ritmo: ${data.salesContext.pace}` : null,
    data.salesContext?.pax ? `Viajeros: ${String(data.salesContext.pax)}` : null,
    Array.isArray(data.salesContext?.interests) && data.salesContext?.interests?.length
      ? `Intereses: ${data.salesContext.interests.join(', ')}`
      : null,
    data.salesContext?.start || data.salesContext?.end
      ? `Fechas: ${data.salesContext?.start || '—'} → ${data.salesContext?.end || '—'}`
      : null,
    data.salesContext?.query ? `Idea inicial: ${data.salesContext.query}` : null,
    data.summary ? `Resumen: ${data.summary}` : null,
  ]
    .filter(Boolean)
    .join(' | ')
    .slice(0, 1800);
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const originErr = assertAllowedOriginOrReferer(req, { allowMissing: false, allowInternalHmac: false });
  if (originErr) return originErr;

  const rl = await checkRateLimit(req, {
    action: 'bot.create_ticket',
    limit: 20,
    windowSeconds: 60 * 60,
    identity: 'ip+vid',
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', requestId },
      { status: 429, headers: withRequestId(undefined, requestId) },
    );
  }

  const clen = contentLengthBytes(req);
  if (clen && clen > 16_000) {
    return jsonError(req, {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Payload too large.',
      requestId,
    });
  }

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid body',
        errorCode: 'INVALID_INPUT',
        details: parsed.error.flatten(),
        requestId,
      },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const ts = await verifyTurnstile(req, parsed.data.turnstileToken);
  if (!ts.ok) {
    return NextResponse.json(
      { error: 'Turnstile failed', errorCode: 'TURNSTILE_FAILED', requestId },
      { status: 403, headers: withRequestId(undefined, requestId) },
    );
  }

  const data: Body = parsed.data;

  const lang = (data.locale || 'es').slice(0, 2).toLowerCase();

  const leadId = await ensureLead({
    email: data.lead?.email ?? null,
    whatsapp: data.lead?.whatsapp ?? null,
    source: data.lead?.source ?? 'chat',
    language: lang,
    consent: true,
    requestId,
  });

  const conversationId = await ensureConversation({
    conversationId: data.conversationId ?? null,
    leadId,
    channel: data.channel,
    language: lang,
    requestId,
  });

  if (data.lastUserMessage) {
    void appendMessage({
      conversationId,
      role: 'user',
      content: data.lastUserMessage,
      meta: { requestId, source: 'bot.create-ticket' },
      requestId,
    });
  }

  const t = await createOrReuseTicket({
    conversationId,
    leadId,
    summary: data.summary,
    priority: data.priority,
    requestId,
  });

  let dealId: string | null = null;
  let taskId: string | null = null;
  if (leadId && shouldCreateCommercialFollowUp(data)) {
    try {
      const routed = await createOrReuseDeal({
        leadId,
        tourSlug: data.salesContext?.slug || null,
        title: buildDealTitle(data),
        stage: data.topic === 'booking' ? 'checkout' : data.topic === 'plan' ? 'qualified' : 'contacted',
        source: data.lead?.source || 'contact_page',
        notes: buildDealNotes(data),
        requestId,
      });
      dealId = routed.dealId;
      if (dealId) {
        const dueAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
        taskId = await createTask({
          dealId,
          ticketId: t.ticketId,
          title: 'Responder contacto comercial y continuar caso en ≤12h',
          priority: data.priority === 'urgent' ? 'urgent' : data.priority === 'high' ? 'high' : 'normal',
          dueAt,
          requestId,
        });
      }
    } catch {
      // best effort: no romper ticket/handoff por fallos de CRM
    }
  }

  return NextResponse.json(
    {
      ok: Boolean(t.ticketId),
      ticketId: t.ticketId,
      dealId,
      taskId,
      reused: t.reused,
      conversationId,
      requestId,
    },
    { status: t.ticketId ? 201 : 500, headers: withRequestId(undefined, requestId) },
  );
}
