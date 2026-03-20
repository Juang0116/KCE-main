// src/app/api/admin/outbound/[id]/sent/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope, getAdminActor } from '@/lib/adminAuth';
import { updateOutboundStatus } from '@/lib/outbound.server';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });

/**
 * Confirma el envío de un mensaje de salida.
 * Limpia errores previos y registra la métrica de éxito.
 */
export async function POST(
  req: NextRequest, 
  ctx: { params: Promise<{ id: string }> }
) {
  // 1. Contexto y Seguridad
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const actorRaw = await getAdminActor(req).catch(() => 'admin');
  const actor = String(actorRaw);

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Servicio de base de datos no disponible', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 2. Validación del Parámetro ID
    const params = ParamsSchema.safeParse(await ctx.params);
    if (!params.success) {
      return NextResponse.json(
        { ok: false, error: 'ID de mensaje no válido', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { id } = params.data;

    // 3. Ejecución de la Transición de Estado
    // Marcamos como 'sent', registramos la fecha y eliminamos cualquier rastro de error
    const updated = await updateOutboundStatus(id, { 
      status: 'sent', 
      sent_at: new Date().toISOString(), 
      error: null 
    });

    // 4. Registro de Éxito y Auditoría
    await logEvent('outbound.marked_sent', { 
      requestId, 
      outboundId: id, 
      actor,
      status: 'sent'
    });

    return NextResponse.json(
      { ok: true, item: updated, requestId }, 
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al confirmar envío de mensaje';

    await logEvent('api.error', { 
      requestId, 
      route: '/api/admin/outbound/[id]/sent', 
      message: errorMessage,
      outboundId: (await ctx.params).id
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo interno al marcar el mensaje como enviado', requestId }, 
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}