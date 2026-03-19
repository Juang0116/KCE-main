import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().optional().nullable(),
  status: z.enum(['active', 'paused', 'closed']).optional(),
  commission_bps: z.number().int().min(0).max(5000).optional(), // Max 50%
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'growth.manage');
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const sb = getSupabaseAdmin();

  if (!sb) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Supabase admin not configured' },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = UpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Payload inválido', issues: parsed.error.issues },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    // Actualización con casteo para evitar colapso de tipos
    const { data, error } = await (sb as any)
      .from('affiliates')
      .update(parsed.data)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Afiliado no encontrado' },
        { status: 404, headers: withRequestId(undefined, requestId) }
      );
    }

    // Registro de auditoría para cambios en finanzas/estatus
    void logEvent('admin.affiliate_updated', { affiliateId: id, updates: Object.keys(parsed.data) });

    return NextResponse.json(
      { ok: true, requestId, item: data },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, requestId, error: err.message || 'Error interno' },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'growth.manage');
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const sb = getSupabaseAdmin();

  if (!sb) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Supabase admin not configured' },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    const { error } = await (sb as any).from('affiliates').delete().eq('id', id);
    if (error) throw error;

    void logEvent('admin.affiliate_deleted', { affiliateId: id });

    return NextResponse.json(
      { ok: true, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, requestId, error: err.message },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}