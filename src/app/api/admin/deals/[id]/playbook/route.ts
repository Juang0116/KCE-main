// src/app/api/admin/deals/[id]/playbook/route.ts
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

const BodySchema = z.object({
  kind: z.enum(['followup_24h', 'proposal', 'checkout_push']),
});

type TaskInsert = {
  deal_id: string;
  title: string;
  priority: 'normal' | 'high' | 'urgent';
  due_at: string;
  status: 'open' | 'done' | 'canceled';
};

function nowPlus(hours: number) {
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

function templates(kind: z.infer<typeof BodySchema>['kind']) {
  // placeholders: {{name}}, {{tour}}, {{date}}, {{url}}
  if (kind === 'checkout_push') {
    return {
      whatsapp:
        "Hola {{name}} 🙂 Ya te dejé el link de pago para asegurar tu reserva ({{tour}} - {{date}}): {{url}}\n\nSi necesitas ayuda para completar el pago, dime y te acompaño paso a paso.",
      emailSubject: 'Tu link de pago para confirmar la reserva',
      emailBody:
        'Hola {{name}},\n\nAquí tienes el link de pago para confirmar tu reserva ({{tour}} - {{date}}):\n{{url}}\n\nSi tienes cualquier duda, responde este correo y te ayudamos.\n\n— KCE',
    };
  }
  if (kind === 'proposal') {
    return {
      whatsapp:
        'Hola {{name}} 👋 Te comparto la propuesta para tu experiencia en {{tour}}.\n\n¿Te parece si la revisamos y te mando el link de pago para confirmar?',
      emailSubject: 'Propuesta de experiencia (KCE)',
      emailBody:
        'Hola {{name}},\n\nAdjunto/comparto la propuesta para tu experiencia: {{tour}}.\n\nSi estás de acuerdo, te envío el link de pago para confirmar la reserva.\n\n— KCE',
    };
  }
  return {
    whatsapp:
      'Hola {{name}} 👋 ¿Cómo vas? Quedo pendiente para ayudarte con tu reserva/plan.\n\nSi quieres, dime fecha y número de personas y te dejo todo listo.',
    emailSubject: 'Seguimiento rápido — KCE',
    emailBody:
      'Hola {{name}},\n\nSolo paso a hacer seguimiento. Quedo pendiente para ayudarte con tu plan y dejar tu reserva lista.\n\n¿Fecha tentativa y número de personas?\n\n— KCE',
  };
}

function buildTasks(kind: z.infer<typeof BodySchema>['kind'], dealId: string): TaskInsert[] {
  if (kind === 'checkout_push') {
    return [
      {
        deal_id: dealId,
        title: 'Enviar link de pago (checkout) al cliente',
        priority: 'urgent',
        due_at: nowPlus(1),
        status: 'open',
      },
      {
        deal_id: dealId,
        title: 'Verificar pago / confirmar checkout (6h)',
        priority: 'urgent',
        due_at: nowPlus(6),
        status: 'open',
      },
    ];
  }
  if (kind === 'proposal') {
    return [
      {
        deal_id: dealId,
        title: 'Preparar propuesta / itinerario (12h)',
        priority: 'high',
        due_at: nowPlus(12),
        status: 'open',
      },
      {
        deal_id: dealId,
        title: 'Confirmar recepción de propuesta (48h)',
        priority: 'normal',
        due_at: nowPlus(48),
        status: 'open',
      },
    ];
  }
  return [
    {
      deal_id: dealId,
      title: 'Follow-up lead (24h)',
      priority: 'high',
      due_at: nowPlus(24),
      status: 'open',
    },
    {
      deal_id: dealId,
      title: 'Follow-up lead (48h)',
      priority: 'normal',
      due_at: nowPlus(48),
      status: 'open',
    },
  ];
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const params = ParamsSchema.safeParse(await ctx.params);
  if (!params.success) {
    return NextResponse.json(
      { error: 'Invalid params', requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const bodyJson = await req.json().catch(() => null);
  const body = BodySchema.safeParse(bodyJson);
  if (!body.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: body.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const dealId = params.data.id;
  const kind = body.data.kind;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Supabase admin not configured', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  const tasks = buildTasks(kind, dealId);

  // NOTE: si tu Supabase types no incluye "tasks", el tipado cae en "never".
  // Forzamos any aquí para destrabar build.
  const ins: any = await (admin as any).from('tasks').insert(tasks);

  if (ins?.error) {
    await logEvent(
      'api.error',
      {
        request_id: requestId,
        route: '/api/admin/deals/[id]/playbook',
        message: ins.error.message,
        deal_id: dealId,
      },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'DB error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  await logEvent(
    'admin.deal_playbook_applied',
    {
      requestId,
      dealId,
      kind,
      tasks: tasks.map((t) => ({ title: t.title, due_at: t.due_at, priority: t.priority })),
    },
    { source: 'admin' },
  );

  return NextResponse.json(
    { ok: true, dealId, kind, tasksCreated: tasks.length, templates: templates(kind), requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
