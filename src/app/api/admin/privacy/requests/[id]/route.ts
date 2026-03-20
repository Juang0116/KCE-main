// src/app/api/admin/privacy/requests/[id]/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability, getAdminActor } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });
const BodySchema = z.object({
  status: z.enum(['open', 'in_progress', 'done', 'rejected']).optional(),
  notes: z.string().trim().max(4000).optional(),
}).strict();

/**
 * Actualiza el estado de una solicitud de privacidad (GDPR/Derechos ARCO).
 * Garantiza la trazabilidad necesaria para el cumplimiento normativo.
 */
export async function PATCH(
  req: NextRequest, 
  ctx: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'privacy.manage');
  if (!auth.ok) return auth.response;

  const actorRaw = await getAdminActor(req).catch(() => 'admin');
  const actor = String(actorRaw);

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Servicio de administración no disponible', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 1. Validación de Identidad y Cuerpo
    const params = ParamsSchema.safeParse(await ctx.params);
    if (!params.success) {
      return NextResponse.json({ ok: false, error: 'ID de solicitud inválido', requestId }, { status: 400 });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Datos de actualización inválidos', details: parsed.error.flatten(), requestId }, { status: 400 });
    }

    const { id } = params.data;
    const { status, notes } = parsed.data;

    // 2. Construcción del parche (Exact Optional Property Types)
    const patch: any = {};
    
    if (status !== undefined) {
      patch.status = status;
      // Si el estado es final, sellamos la fecha de procesamiento
      const isFinal = ['done', 'rejected'].includes(status);
      patch.processed_at = isFinal ? new Date().toISOString() : null;
    }

    if (notes !== undefined) {
      patch.notes = notes;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: true, id, requestId }, { status: 200 });
    }

    // 3. Persistencia en Base de Datos
    const db = admin as any;
    const { error: dbError } = await db
      .from('privacy_requests')
      .update(patch)
      .eq('id', id);

    if (dbError) throw dbError;

    // 4. Registro de Auditoría (Crítico para cumplimiento)
    await logEvent('privacy.request_updated', {
      requestId,
      requestId_privacy: id,
      actor,
      status: status ?? 'unchanged',
      hasNotes: !!notes
    });

    return NextResponse.json(
      { ok: true, id, requestId }, 
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error en gestión de privacidad';
    
    await logEvent('api.error', { 
      requestId, 
      route: 'privacy.requests.patch', 
      message: msg 
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo al actualizar la solicitud de privacidad', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}