// src/app/api/admin/outbound/[id]/replied/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope, getAdminActor } from '@/lib/adminAuth';
import { markOutboundReplied } from '@/lib/outbound.server';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });
const BodySchema = z.object({
  note: z.string().trim().max(1000).optional().nullable(),
});

/**
 * Marca un mensaje de salida como respondido.
 * Detiene automáticamente las secuencias de seguimiento vinculadas al lead.
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

  try {
    // 2. Validación de Entrada
    const params = ParamsSchema.safeParse(await ctx.params);
    if (!params.success) {
      return NextResponse.json(
        { ok: false, error: 'ID de mensaje no válido', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const json = await req.json().catch(() => ({}));
    const body = BodySchema.safeParse(json);

    if (!body.success) {
      return NextResponse.json(
        { ok: false, error: 'Nota inválida', details: body.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { id } = params.data;
    const note = body.data.note ?? null;

    // 3. Ejecución de la Lógica de Negocio
    // Nota: Esto suele disparar el evento de "Unenroll" en las secuencias activas
    const updated = await markOutboundReplied(id, note);

    // 4. Registro de Éxito y Auditoría
    await logEvent('outbound.marked_replied', { 
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
    const errorMessage = error instanceof Error ? error.message : 'Error al procesar respuesta del mensaje';

    await logEvent('api.error', { 
      requestId, 
      route: '/api/admin/outbound/[id]/replied', 
      message: errorMessage,
      outboundId: (await ctx.params).id
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo interno al marcar como respondido', requestId }, 
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}