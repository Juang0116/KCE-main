// src/app/api/admin/leads/[id]/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

const UpdateSchema = z
  .object({
    stage: z.enum(['new', 'qualified', 'proposal', 'won', 'lost']).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
    notes: z.string().max(4000).nullable().optional(),
  })
  .strict();

type LeadPatch = {
  stage?: 'new' | 'qualified' | 'proposal' | 'won' | 'lost';
  tags?: string[];
  notes?: string | null;
};

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const { id } = ParamsSchema.parse(await ctx.params);

    const body = await req.json().catch(() => null);
    const parsed = UpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    // ✅ exactOptionalPropertyTypes: no incluir keys con undefined
    const patch: LeadPatch = {};
    if (parsed.data.stage !== undefined) patch.stage = parsed.data.stage;
    if (parsed.data.tags !== undefined) patch.tags = parsed.data.tags;
    if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { ok: true, id, requestId },
        { status: 200, headers: withRequestId(undefined, requestId) },
      );
    }

    const admin = getSupabaseAdmin();

    /**
     * 🔧 FIX "never":
     * Si Database types no incluyen 'leads', Supabase infiere never para Update.
     * Este cast es un workaround seguro a corto plazo.
     * (Solución definitiva: regenerar/ajustar types Database para incluir leads.)
     */
    const res = await (admin as any)
      .from('leads')
      .update(patch as any)
      .eq('id', id)
      .select('id')
      .single();

    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/leads/[id]', message: res.error.message, leadId: id },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    await logEvent(
      'lead.updated',
      {
        requestId,
        leadId: id,
        patch: {
          stage: patch.stage ?? null,
          tags: patch.tags ?? null,
          notes: patch.notes ?? null,
        },
      },
      { source: 'admin', entityId: id, dedupeKey: `lead:updated:${id}:${requestId}` },
    );

    return NextResponse.json(
      { ok: true, id, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/leads/[id]',
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
