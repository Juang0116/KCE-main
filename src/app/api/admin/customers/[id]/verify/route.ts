import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });
const BodySchema = z.object({
  status: z.enum(['verified', 'rejected']),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);

  try {
    const auth = await requireAdminScope(req, 'customers_write');
    if (!auth.ok) return auth.response;

    const rawParams = await ctx.params;
    const parsedParams = ParamsSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json({ error: 'ID inválido', requestId }, { status: 400 });
    }
    const { id } = parsedParams.data;

    const body = await req.json().catch(() => ({}));
    const parsedBody = BodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Estado inválido. Usa: verified | rejected', requestId },
        { status: 400 },
      );
    }
    const { status } = parsedBody.data;

    const admin = getSupabaseAdmin();
    if (!admin)
      return NextResponse.json({ error: 'DB no configurada', requestId }, { status: 503 });

    const { error } = await (admin as any)
      .from('customers')
      .update({ identity_status: status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    void logEvent('admin.customer.identity_updated', {
      customerId: id,
      newStatus: status,
      requestId,
    });

    return NextResponse.json(
      { ok: true, customerId: id, identity_status: status, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado';
    return NextResponse.json({ error: msg, requestId }, { status: 500 });
  }
}
