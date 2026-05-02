import { NextResponse } from 'next/server'; // <-- CORREGIDO: es next/server
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { requireAdmin } from '@/lib/adminGuard';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(); // Solo tú puedes hacer esto
    const { status } = await req.json(); // 'verified' o 'rejected'

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('customers')
      .update({ identity_status: status })
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}