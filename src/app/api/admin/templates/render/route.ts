// src/app/api/admin/templates/render/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { renderCrmTemplate } from '@/lib/templates.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  key: z.string().min(1),
  locale: z.string().min(2).optional().nullable(),
  channel: z.enum(['whatsapp', 'email', 'any']).default('whatsapp'),
  seed: z.string().optional(),
  vars: z.record(z.union([z.string(), z.number(), z.null()])).default({}),
  log: z
    .object({
      dealId: z.string().uuid().optional(),
      ticketId: z.string().uuid().optional(),
      conversationId: z.string().uuid().optional(),
      source: z.string().optional(),
    })
    .optional(),
});

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

  const { key, locale, channel, seed, vars, log } = parsed.data;

  try {
    const rendered = await renderCrmTemplate({
      key,
      // ✅ exactOptionalPropertyTypes: no enviar locale si no existe
      ...(locale ? { locale } : {}),
      channel,
      vars,
      seed: seed ?? null,
      preferWinner: true,
      perfDays: 30,
      minSamples: 30,
    });

    if (log) {
      const entityId = log.dealId ?? log.ticketId ?? log.conversationId ?? null;
      const preview = rendered.body.length > 240 ? rendered.body.slice(0, 240) + '…' : rendered.body;

      await logEvent(
        'crm.outbound_message',
        {
          requestId,
          key,
          channel,
          locale: locale ?? null,
          dealId: log.dealId ?? null,
          ticketId: log.ticketId ?? null,
          conversationId: log.conversationId ?? null,
          source: log.source ?? 'admin',
          preview,
          templateVariant: rendered.templateVariant ?? null,
          templateId: (rendered as any).templateId ?? null,
        },
        { source: 'crm', entityId, dedupeKey: null },
      );
    }

    return NextResponse.json(
      {
        key,
        channel,
        subject: rendered.subject,
        body: rendered.body,
        templateVariant: rendered.templateVariant ?? null,
        requestId,
      },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/templates/render',
        message: e instanceof Error ? e.message : 'unknown',
      },
      { source: 'api', dedupeKey: `api.error:/api/admin/templates/render:${requestId}` },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
