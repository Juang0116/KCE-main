// src/app/api/admin/outbound/[id]/lost/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope, getAdminActor } from '@/lib/adminAuth';
import { markOutboundLost } from '@/lib/outbound.server';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });
const BodySchema = z.object({
  note: z.string().trim().max(1000).optional().nullable(),
});

/**
 * Marca un mensaje de salida como perdido/fallido.
 * Útil para la gestión de errores en campañas de email o secuencias automatizadas.
 */
export async function POST(
  req: NextRequest, 
  ctx: { params: Promise<{ id: string }> }
) {
  // 1. Identificación y Seguridad
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const actorRaw = await getAdminActor(req).catch(() => 'admin');
  const actor = String(actorRaw);

  try {
    // 2. Validación de Parámetros y Cuerpo
    const params = ParamsSchema.safeParse(await ctx.params);
    if (!params.success) {
      return NextResponse.json(
        { ok: false, error: 'ID de mensaje inválido', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const json = await req.json().catch(() => ({}));
    const body = BodySchema.safeParse(json);

    if (!body.success) {
      return NextResponse.json(
        { ok: false, error: 'Datos de nota inválidos', details: body.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { id } = params.data;
    const note = body.data.note ?? null;

    // 3. Ejecución de la lógica de negocio
    const updated = await markOutboundLost(id, note);

    // 4. Registro de Auditoría y Evento
    await logEvent('outbound.marked_lost', { 
      requestId, 
      outboundId: id, 
      actor,
      note: note ? note.slice(0, 50) + '...' : 'Sin nota' 
    });

    return NextResponse.json(
      { ok: true, item: updated, requestId }, 
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al marcar mensaje como perdido';

    await logEvent('api.error', { 
      requestId, 
      route: '/api/admin/outbound/[id]/lost', 
      message: errorMessage,
      outboundId: (await ctx.params).id
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo interno al procesar el estado del mensaje', requestId }, 
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}