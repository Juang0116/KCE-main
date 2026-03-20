// src/app/api/admin/leads/[id]/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({
  id: z.string().uuid({ message: "El ID del lead debe ser un UUID válido" }),
});

const UpdateSchema = z
  .object({
    stage: z.enum(['new', 'qualified', 'proposal', 'won', 'lost']).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
    notes: z.string().max(4000).nullable().optional(),
  })
  .strict();

type LeadPatchPayload = {
  stage?: 'new' | 'qualified' | 'proposal' | 'won' | 'lost';
  tags?: string[];
  notes?: string | null;
};

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  // 1. Autenticación y validación de scope
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 2. Validación segura de parámetros de la URL
    const resolvedParams = await ctx.params;
    const parsedParams = ParamsSchema.safeParse(resolvedParams);

    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'Parámetros de ruta inválidos', details: parsedParams.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { id } = parsedParams.data;

    // 3. Parseo y validación segura del Payload (Body)
    const body = await req.json().catch(() => null);
    const parsedBody = UpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Cuerpo de la petición inválido', details: parsedBody.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    // 4. Construcción del objeto de actualización
    // ✅ exactOptionalPropertyTypes: evitamos incluir llaves con valor 'undefined'
    const patch: LeadPatchPayload = {};
    const { stage, tags, notes } = parsedBody.data;

    if (stage !== undefined) patch.stage = stage;
    if (tags !== undefined) patch.tags = tags;
    if (notes !== undefined) patch.notes = notes;

    // Salida temprana si no hay datos reales para actualizar
    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { ok: true, id, message: 'Sin cambios', requestId },
        { status: 200, headers: withRequestId(undefined, requestId) }
      );
    }

    // 5. Actualización en Base de Datos
    /**
     * 🔧 FIX "never": 
     * Workaround temporal asignando `any` al cliente db hasta que los 
     * types de la Database ('leads') se regeneren y alineen.
     */
    const db = admin as any;

    const { error: updateError } = await db
      .from('leads')
      .update(patch)
      .eq('id', id)
      .select('id')
      .single();

    if (updateError) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/leads/[id]', message: updateError.message, leadId: id },
        { source: 'api' }
      );
      return NextResponse.json(
        { error: 'Error en la base de datos al actualizar el lead', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) }
      );
    }

    // 6. Registro de auditoría (Events Log)
    await logEvent(
      'lead.updated',
      {
        requestId,
        leadId: id,
        patch: {
          stage: patch.stage ?? null,
          tags: patch.tags ?? null,
          notes: patch.notes ?? null,
        },
      },
      { source: 'admin', entityId: id, dedupeKey: `lead:updated:${id}:${requestId}` }
    );

    return NextResponse.json(
      { ok: true, id, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar lead';

    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/leads/[id]', message: errorMessage },
      { source: 'api' }
    );

    return NextResponse.json(
      { error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}