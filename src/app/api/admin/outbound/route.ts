// src/app/api/admin/outbound/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { createOutboundMessage, listOutboundMessages } from '@/lib/outbound.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  status: z.enum(['draft', 'queued', 'sending', 'sent', 'failed', 'canceled']).optional(),
  deal_id: z.string().uuid().optional(),
  ticket_id: z.string().uuid().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(200),
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
});

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    status: url.searchParams.get('status') || undefined,
    deal_id: url.searchParams.get('deal_id') || undefined,
    ticket_id: url.searchParams.get('ticket_id') || undefined,
    q: url.searchParams.get('q') || undefined,
    limit: url.searchParams.get('limit') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  try {
    const items = await listOutboundMessages({
      status: parsed.data.status ?? null,
      dealId: parsed.data.deal_id ?? null,
      ticketId: parsed.data.ticket_id ?? null,
      q: parsed.data.q ?? null,
      limit: parsed.data.limit,
    });

    return NextResponse.json(
      { items, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || 'Failed to list outbound messages'), requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  try {
    // IMPORTANT: exactOptionalPropertyTypes -> no mandar props opcionales con undefined
    const input = {
      channel: parsed.data.channel,
      toEmail: parsed.data.toEmail ?? null,
      toPhone: parsed.data.toPhone ?? null,
      subject: parsed.data.subject ?? null,
      body: parsed.data.body,

      dealId: parsed.data.dealId ?? null,
      ticketId: parsed.data.ticketId ?? null,
      leadId: parsed.data.leadId ?? null,
      customerId: parsed.data.customerId ?? null,

      templateKey: parsed.data.templateKey ?? null,
      templateVariant: parsed.data.templateVariant ?? null,
      metadata: parsed.data.metadata ?? {},

      ...(parsed.data.provider !== undefined ? { provider: parsed.data.provider } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
    };

    const msg = await createOutboundMessage(input);

    return NextResponse.json(
      { item: msg, requestId },
      { status: 201, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || 'Failed to create outbound message'), requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
