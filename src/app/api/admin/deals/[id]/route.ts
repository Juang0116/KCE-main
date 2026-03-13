// src/app/api/admin/deals/[id]/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { createTask } from '@/lib/botStorage.server';
import { maybeEnqueueDealStageMessage } from '@/lib/salesOutboundTriggers.server';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

const PatchSchema = z
  .object({
    stage: z.string().min(1).max(40).optional(),
    title: z.string().max(200).optional(),
    notes: z.string().max(4000).optional(),
    amount_minor: z.coerce.number().int().min(0).optional(),
    currency: z.string().min(3).max(3).optional(),
    probability: z.coerce.number().int().min(0).max(100).optional(),
    assigned_to: z.string().max(120).optional(),
    source: z.string().max(120).optional(),
    tour_slug: z.string().max(200).optional(),
    lead_id: z.string().uuid().nullable().optional(),
    customer_id: z.string().uuid().nullable().optional(),
    closed_at: z.string().datetime().nullable().optional(),
  })
  .strict();

type DealRow = {
  id: string;
  lead_id: string | null;
  customer_id: string | null;
  tour_slug: string | null;
  title: string | null;
  stage: string | null;
  amount_minor: number | null;
  currency: string | null;
  probability: number | null;
  assigned_to: string | null;
  notes: string | null;
  source: string | null;
  created_at: string | null;
  updated_at: string | null;
  closed_at: string | null;
};

type DealHydrated = DealRow & {
  leads: { email: string | null; whatsapp: string | null } | null;
  customers: { email: string | null; name: string | null; phone: string | null } | null;
};

function dueInHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function followUpForStage(stageRaw: string | null | undefined) {
  const stage = (stageRaw || '').toLowerCase().trim();
  // Simple, aggressive defaults for speed-to-close.
  if (stage === 'contacted') {
    return { title: 'Follow-up cliente (24h)', hours: 24, priority: 'normal' as const };
  }
  if (stage === 'qualified') {
    return { title: 'Preparar propuesta / itinerario', hours: 12, priority: 'high' as const };
  }
  if (stage === 'proposal') {
    return { title: 'Confirmar recepción propuesta (48h)', hours: 48, priority: 'normal' as const };
  }
  if (stage === 'checkout') {
    return { title: 'Revisar checkout/pago (6h)', hours: 6, priority: 'urgent' as const };
  }
  if (stage === 'won') {
    return { title: 'Post-venta: onboarding + próximos pasos (24h)', hours: 24, priority: 'normal' as const };
  }
  return null;
}

async function hydrateParties(
  admin: ReturnType<typeof getSupabaseAdmin>,
  deal: DealRow,
): Promise<DealHydrated> {
  const leadId = deal.lead_id;
  const customerId = deal.customer_id;

  const [leadRes, customerRes] = await Promise.all([
    leadId
      ? admin.from('leads').select('email,whatsapp').eq('id', leadId).maybeSingle()
      : Promise.resolve(null),
    customerId
      ? admin.from('customers').select('email,name,phone').eq('id', customerId).maybeSingle()
      : Promise.resolve(null),
  ]);

  const leads =
    leadRes && !('error' in leadRes) && (leadRes as any).data
      ? {
          email: (leadRes as any).data.email ?? null,
          whatsapp: (leadRes as any).data.whatsapp ?? null,
        }
      : null;

  const customers =
    customerRes && !('error' in customerRes) && (customerRes as any).data
      ? {
          email: (customerRes as any).data.email ?? null,
          name: (customerRes as any).data.name ?? null,
          phone: (customerRes as any).data.phone ?? null,
        }
      : null;

  return { ...deal, leads, customers };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const { id } = await ctx.params;
    const p = ParamsSchema.safeParse({ id });
    if (!p.success) {
      return NextResponse.json(
        { error: 'Bad params', details: p.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const admin = getSupabaseAdmin();

    // IMPORTANT: 'deals' no está tipado en supabase.ts -> casteamos SOLO esta query.
    const res = await (admin as any)
      .from('deals')
      .select(
        'id,lead_id,customer_id,tour_slug,title,stage,amount_minor,currency,probability,assigned_to,notes,source,created_at,updated_at,closed_at',
      )
      .eq('id', p.data.id)
      .maybeSingle();

    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/deals/[id]', message: res.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    if (!res.data) {
      return NextResponse.json(
        { error: 'Not found', requestId },
        { status: 404, headers: withRequestId(undefined, requestId) },
      );
    }

    const deal = res.data as unknown as DealRow;
    const item = await hydrateParties(admin, deal);

    return NextResponse.json(
      { item, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/deals/[id]',
        message: e instanceof Error ? e.message : 'unknown',
      },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const { id } = await ctx.params;
    const p = ParamsSchema.safeParse({ id });
    if (!p.success) {
      return NextResponse.json(
        { error: 'Bad params', details: p.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad body', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const admin = getSupabaseAdmin();

    // Read previous stage to detect transitions.
    let prevStage: string | null = null;
    try {
      const prev = await (admin as any)
        .from('deals')
        .select('stage')
        .eq('id', p.data.id)
        .maybeSingle();
      if (!prev?.error && prev?.data) prevStage = (prev.data.stage ?? null) as any;
    } catch {
      // ignore
    }

    const nextStage = parsed.data.stage ?? null;
    const isClosingStage = typeof nextStage === 'string' && ['won', 'lost'].includes(nextStage);

    const upd = {
      ...parsed.data,
      ...(isClosingStage && !('closed_at' in parsed.data)
        ? { closed_at: new Date().toISOString() }
        : {}),
      updated_at: new Date().toISOString(),
    };

    const res = await (admin as any)
      .from('deals')
      .update(upd)
      .eq('id', p.data.id)
      .select(
        'id,lead_id,customer_id,tour_slug,title,stage,amount_minor,currency,probability,assigned_to,notes,source,created_at,updated_at,closed_at',
      )
      .maybeSingle();

    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/deals/[id]', message: res.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    if (!res.data) {
      return NextResponse.json(
        { error: 'Not found', requestId },
        { status: 404, headers: withRequestId(undefined, requestId) },
      );
    }

    const deal = res.data as unknown as DealRow;
    const item = await hydrateParties(admin, deal);

    // Auto-create a follow-up task on stage transition (best-effort)
    try {
      const transitioned =
        typeof nextStage === 'string' &&
        nextStage.trim().length > 0 &&
        (prevStage || '').toLowerCase().trim() !== nextStage.toLowerCase().trim();

      if (transitioned) {
        const rule = followUpForStage(nextStage);
        if (rule) {
          await createTask({
            dealId: item.id,
            title: rule.title,
            priority: rule.priority as any,
            dueAt: dueInHours(rule.hours),
            requestId,
          });
        }
      
        try {
          await maybeEnqueueDealStageMessage({
            dealId: item.id,
            stage: nextStage,
            locale: (item as any).locale ?? null,
            source: 'api.deals.patch',
            requestId,
          });
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    return NextResponse.json(
      { item, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/deals/[id]',
        message: e instanceof Error ? e.message : 'unknown',
      },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const { id } = await ctx.params;
    const p = ParamsSchema.safeParse({ id });
    if (!p.success) {
      return NextResponse.json(
        { error: 'Bad params', details: p.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const admin = getSupabaseAdmin();

    const res = await (admin as any).from('deals').delete().eq('id', p.data.id);

    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/deals/[id]', message: res.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    return NextResponse.json(
      { ok: true, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/deals/[id]',
        message: e instanceof Error ? e.message : 'unknown',
      },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
