import 'server-only';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { requireAdmin } from '@/lib/adminGuard';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Validamos que solo el administrador pueda hacer esto
    await requireAdmin();

    const body = await req.json();
    const { status } = body;

    // 2. Validamos que el estado sea correcto
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    // 3. Actualizamos en Supabase
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', params.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error actualizando estado' },
      { status: 500 }
    );
  }
}