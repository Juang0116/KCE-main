import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(req.headers);

  try {
    const auth = await requireAdminScope(req, 'customers_read');
    if (!auth.ok) return auth.response;

    const rawParams = await ctx.params;
    const parsed = ParamsSchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json({ error: 'ID inválido', requestId }, { status: 400 });
    }
    const { id } = parsed.data;

    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('No Supabase Admin');

    const { data: customer } = await (supabase as any)
      .from('customers')
      .select('identity_doc_path')
      .eq('id', id)
      .single();

    if (!customer?.identity_doc_path) {
      return NextResponse.json({ error: 'No hay documento registrado', requestId }, { status: 404 });
    }

    // Signed URL válida 120 segundos
    const { data, error } = await supabase.storage
      .from('identity_vault')
      .createSignedUrl(customer.identity_doc_path, 120);

    if (error) throw error;

    return NextResponse.json({ url: data.signedUrl, requestId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado';
    return NextResponse.json({ error: msg, requestId }, { status: 500 });
  }
}
