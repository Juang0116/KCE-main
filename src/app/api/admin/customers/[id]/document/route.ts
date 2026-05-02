import 'server-only';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { requireAdminScope } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // 1. Validar que eres el Admin
    const auth = await requireAdminScope(req as any);
    if (!auth.ok) return auth.response;

    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('No Supabase Admin');

    // 2. Buscar la ruta del documento del cliente
    const { data: customer } = await supabase
      .from('customers')
      .select('identity_doc_path')
      .eq('id', params.id)
      .single();

    if (!customer?.identity_doc_path) {
      return NextResponse.json({ error: 'No hay documento' }, { status: 404 });
    }

    // 3. Generar URL firmada con la LLAVE MAESTRA (Ignora todos los bloqueos)
    const { data, error } = await supabase.storage
      .from('identity_vault')
      .createSignedUrl(customer.identity_doc_path, 60); // Válido por 60 segundos

    if (error) throw error;

    return NextResponse.json({ url: data.signedUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}