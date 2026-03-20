// src/app/api/admin/reviews/[id]/approve/route.ts
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
 * Aprueba y publica una reseña de cliente.
 * Establece el estado como 'approved' y registra la fecha de publicación.
 */
export async function POST(
  req: NextRequest, 
  ctx: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(req.headers);
  
  try {
    // 1. Seguridad: Requiere capacidad de moderación de reseñas
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

    // 2. Validación del ID de la reseña
    const params = ParamsSchema.safeParse(await ctx.params);
    if (!params.success) {
      return NextResponse.json(
        { ok: false, error: 'ID de reseña no válido', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { id } = params.data;
    const now = new Date().toISOString();

    // 3. Ejecución de la aprobación
    // Actualizamos el estado, el flag de aprobación y la fecha de publicación en un solo paso
    const { data, error } = await (sb as any)
      .from('reviews')
      .update({ 
        status: 'approved', 
        approved: true, 
        published_at: now,
        updated_at: now 
      })
      .eq('id', id)
      .select('id, status, approved, published_at')
      .single();

    if (error) throw error;

    // 4. Registro de Auditoría
    await logEvent('review.approved', { 
      requestId, 
      reviewId: id, 
      actor,
      tourId: (data as any)?.tour_id 
    });

    return NextResponse.json(
      { ok: true, item: data, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido al aprobar';
    
    await logEvent('api.error', { 
      requestId, 
      route: 'reviews.approve', 
      message: errorMessage,
      reviewId: (await ctx.params).id 
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo al procesar la aprobación de la reseña', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}