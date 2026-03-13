// src/app/api/admin/leads/[id]/convert/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { normalizeEmail, normalizePhone } from '@/lib/normalize';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const { id } = ParamsSchema.parse(await ctx.params);

    const admin = getSupabaseAdmin();
    const sb = admin as any; // <- bypass "never" types until Database types are aligned

    const leadRes = await sb
      .from('leads')
      .select('id,email,whatsapp,language,source,stage,created_at')
      .eq('id', id)
      .single();

    if (leadRes.error || !leadRes.data) {
      return NextResponse.json(
        { error: 'Lead no encontrado', requestId },
        { status: 404, headers: withRequestId(undefined, requestId) },
      );
    }

    const email = normalizeEmail(leadRes.data.email);
    if (!email) {
      return NextResponse.json(
        { error: 'El lead no tiene email (requerido para convertir)', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const phone = normalizePhone(leadRes.data.whatsapp);

    const languageRaw = leadRes.data.language;
    const language =
      typeof languageRaw === 'string' && languageRaw.trim()
        ? languageRaw.trim().toLowerCase()
        : null;

    // Upsert customer by email
    const cust = await sb
      .from('customers')
      .upsert(
        {
          email,
          phone: phone || null,
          language,
        },
        { onConflict: 'email' },
      )
      .select('id')
      .single();

    if (cust.error || !cust.data?.id) {
      await logEvent(
        'api.error',
        {
          requestId,
          route: '/api/admin/leads/[id]/convert',
          message: cust.error?.message || 'customers upsert failed',
          leadId: id,
        },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const customerId = String(cust.data.id);

    // Mark lead as won and attach customer_id
    const upd = await sb
      .from('leads')
      .update({ stage: 'won', customer_id: customerId })
      .eq('id', id);

    if (upd.error) {
      await logEvent(
        'api.error',
        {
          requestId,
          route: '/api/admin/leads/[id]/convert',
          message: upd.error.message,
          leadId: id,
          customerId,
        },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    await logEvent(
      'lead.converted',
      { requestId, leadId: id, customerId, email },
      { source: 'crm', entityId: id, dedupeKey: `lead:converted:${id}` },
    );

    await logEvent(
      'customer.upserted',
      { requestId, customerId, email },
      { source: 'crm', entityId: customerId, dedupeKey: `customer:upserted:${email}` },
    );

    return NextResponse.json(
      { ok: true, leadId: id, customerId, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/leads/[id]/convert',
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
