// src/app/api/admin/outbound/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope, getAdminActor } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { createOutboundMessage, listOutboundMessages } from '@/lib/outbound.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  status: z.enum(['draft', 'queued', 'sending', 'sent', 'failed', 'canceled']).optional(),
  deal_id: z.string().uuid().optional(),
  ticket_id: z.string().uuid().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

const BodySchema = z.object({
  channel: z.enum(['whatsapp', 'email']),
  provider: z.string().optional(),
  status: z.enum(['draft', 'queued', 'sending', 'sent', 'failed', 'canceled']).optional(),
  toEmail: z.string().email().optional().nullable(),
  toPhone: z.string().optional().nullable(),
  subject: z.string().max(2000).optional().nullable(),
  body: z.string().min(1).max(20000),
  dealId: z.string().uuid().optional().nullable(),
  ticketId: z.string().uuid().optional().nullable(),
  leadId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  templateKey: z.string().optional().nullable(),
  templateVariant: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().default({}),
}).strict();

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const items = await listOutboundMessages({
      status: parsed.data.status ?? null,
      dealId: parsed.data.deal_id ?? null,
      ticketId: parsed.data.ticket_id ?? null,
      q: parsed.data.q ?? null,
      limit: parsed.data.limit,
    });

    return NextResponse.json({ ok: true, items, requestId }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error en GET';
    await logEvent('api.error', { requestId, route: 'outbound.list', message: msg });
    return NextResponse.json({ error: 'Fallo al listar mensajes', requestId }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const actorRaw = await getAdminActor(req).catch(() => 'admin');
  const actor = String(actorRaw);

  try {
    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Body inválido', details: parsed.error.flatten(), requestId },
        { status: 400 }
      );
    }

    const { data } = parsed;

    // CONSTRUCCIÓN SEGURA PARA exactOptionalPropertyTypes
    // Solo definimos las propiedades base que son obligatorias o nulas
    const input: any = {
      channel: data.channel,
      body: data.body,
      toEmail: data.toEmail ?? null,
      toPhone: data.toPhone ?? null,
      subject: data.subject ?? null,
      dealId: data.dealId ?? null,
      ticketId: data.ticketId ?? null,
      leadId: data.leadId ?? null,
      customerId: data.customerId ?? null,
      templateKey: data.templateKey ?? null,
      templateVariant: data.templateVariant ?? null,
      metadata: data.metadata,
    };

    // Solo añadimos estas llaves si realmente existen (no son undefined)
    if (data.provider !== undefined) input.provider = data.provider;
    if (data.status !== undefined) input.status = data.status;

    const msg = await createOutboundMessage(input);

    await logEvent('outbound.message_created', {
      requestId,
      outboundId: msg.id,
      channel: data.channel,
      actor,
    });

    return NextResponse.json({ ok: true, item: msg, requestId }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error en POST';
    await logEvent('api.error', { requestId, route: 'outbound.create', message: msg });
    return NextResponse.json({ error: 'Fallo al crear mensaje', requestId }, { status: 500 });
  }
}