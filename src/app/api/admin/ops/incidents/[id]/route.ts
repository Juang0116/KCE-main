// src/app/api/admin/ops/incidents/[id]/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });

/**
 * Recupera el contexto completo de un incidente.
 * Une datos del incidente, línea de tiempo y postmortem en un solo objeto.
 */
export async function GET(
  req: NextRequest, 
  ctx: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Servicio de base de datos no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 1. Validar parámetros de la URL
    const params = ParamsSchema.safeParse(await ctx.params);
    if (!params.success) {
      return NextResponse.json(
        { ok: false, error: 'ID de incidente inválido', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { id } = params.data;
    const db = admin as any; // Bypass temporal de tipos para tablas Ops

    // 2. Consulta inicial: Verificar existencia del incidente
    const { data: incident, error: incidentError } = await db
      .from('ops_incidents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (incidentError) throw new Error(`Error al leer incidente: ${incidentError.message}`);
    if (!incident) {
      return NextResponse.json(
        { ok: false, error: 'Incidente no encontrado', requestId },
        { status: 404, headers: withRequestId(undefined, requestId) }
      );
    }

    // 3. Consultas en Paralelo: Hidratar con actualizaciones y postmortem
    // Optimizamos el rendimiento cargando ambos recursos simultáneamente
    const [updatesRes, postmortemRes] = await Promise.all([
      db.from('ops_incident_updates')
        .select('*')
        .eq('incident_id', id)
        .order('created_at', { ascending: false })
        .limit(200),
      db.from('ops_postmortems')
        .select('*')
        .eq('incident_id', id)
        .maybeSingle()
    ]);

    // 4. Respuesta consolidada
    return NextResponse.json(
      { 
        ok: true, 
        requestId, 
        incident, 
        updates: updatesRes.data ?? [], 
        postmortem: postmortemRes.data ?? null 
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al recuperar contexto del incidente';

    await logEvent('api.error', { 
      requestId, 
      route: '/api/admin/ops/incidents/[id]', 
      message: errorMessage 
    });

    return NextResponse.json(
      { ok: false, error: 'Error interno al cargar los datos del incidente', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}