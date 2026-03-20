// src/app/api/admin/ops/incidents/[id]/resolve/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminCapability } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Finaliza el ciclo de vida de un incidente operativo.
 * Registra la resolución y detiene las alertas de escalado.
 */
export async function POST(
  req: NextRequest, 
  ctx: { params: Promise<{ id: string }> }
) {
  // 1. Contexto y Seguridad
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'alerts_ack');
  
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Servicio de base de datos no disponible', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  const { id } = await ctx.params;
  const actor = (auth as any)?.actor || 'admin';

  try {
    const db = admin as any;
    const now = new Date().toISOString();

    // 2. Transición de estado a 'resolved'
    const { data, error: dbError } = await db
      .from('ops_incidents')
      .update({ 
        status: 'resolved', 
        resolved_at: now, 
        updated_at: now 
      })
      .eq('id', id)
      .select('id, type, severity, created_at')
      .maybeSingle();

    if (dbError) {
      throw new Error(`Fallo en base de datos al resolver incidente: ${dbError.message}`);
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: 'Incidente no encontrado o ya resuelto', requestId },
        { status: 404, headers: withRequestId(undefined, requestId) }
      );
    }

    // 3. Registro de Éxito y Observabilidad (MTTR)
    await logEvent('ops.incident_resolved', { 
      requestId, 
      incidentId: id, 
      actor,
      type: data.type,
      severity: data.severity,
      duration_ms: new Date(now).getTime() - new Date(data.created_at).getTime()
    });

    return NextResponse.json(
      { ok: true, id: data.id, status: 'resolved', requestId }, 
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al resolver incidente';

    await logEvent('api.error', { 
      requestId, 
      route: '/api/admin/ops/incidents/[id]/resolve', 
      message: errorMessage,
      incidentId: id
    });

    return NextResponse.json(
      { ok: false, error: 'Error interno al procesar la resolución', requestId }, 
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}