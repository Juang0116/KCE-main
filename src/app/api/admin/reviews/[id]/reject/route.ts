// src/app/api/admin/reviews/[id]/reject/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope, getAdminActor } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });

/**
 * Rechaza una reseña de cliente.
 * Cambia el estado a 'rejected' y asegura que el contenido no sea público.
 */
export async function POST(
  req: NextRequest, 
  ctx: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(req.headers);
  
  try {
    // 1. Seguridad: Requiere capacidad de moderación
    const auth = await requireAdminScope(req, 'reviews_moderate');
    if (!auth.ok) return auth.response;

    const actorRaw = await getAdminActor(req).catch(() => 'admin');
    const actor = String(actorRaw);

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json(
        { ok: false, error: 'Servicio de base de datos no disponible', requestId },
        { status: 503, headers: withRequestId(undefined, requestId) }
      );
    }

    // 2. Validación del Parámetro ID
    const params = ParamsSchema.safeParse(await ctx.params);
    if (!params.success) {
      return NextResponse.json(
        { ok: false, error: 'ID de reseña inválido', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { id } = params.data;

    // 3. Ejecución del rechazo
    // Seteamos status 'rejected', quitamos el flag 'approved' y limpiamos la fecha de publicación
    const { data, error } = await (sb as any)
      .from('reviews')
      .update({ 
        status: 'rejected', 
        approved: false, 
        published_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, status, approved, published_at')
      .single();

    if (error) throw error;

    // 4. Registro de Auditoría
    await logEvent('review.rejected', { 
      requestId, 
      reviewId: id, 
      actor,
      status: 'rejected'
    });

    return NextResponse.json(
      { ok: true, item: data, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido al rechazar';
    
    await logEvent('api.error', { 
      requestId, 
      route: 'reviews.reject', 
      message: errorMessage,
      reviewId: (await ctx.params).id 
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo interno al procesar el rechazo de la reseña', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}