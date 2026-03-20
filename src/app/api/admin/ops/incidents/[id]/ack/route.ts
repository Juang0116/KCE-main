// src/app/api/admin/ops/incidents/[id]/ack/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminCapability } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Marca un incidente como "reconocido" (Acked).
 * Detiene el escalado de alertas y registra el tiempo de respuesta humana.
 */
export async function POST(
  req: NextRequest, 
  ctx: { params: Promise<{ id: string }> }
) {
  // 1. Identificación y Seguridad
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

    // 2. Actualización del estado del incidente
    const { data, error: dbError } = await db
      .from('ops_incidents')
      .update({ 
        status: 'acked', 
        acknowledged_at: now, 
        updated_at: now 
      })
      .eq('id', id)
      .select('id, severity, type')
      .maybeSingle();

    if (dbError) {
      throw new Error(`Fallo en base de datos al reconocer incidente: ${dbError.message}`);
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: 'Incidente no encontrado o ya procesado', requestId },
        { status: 404, headers: withRequestId(undefined, requestId) }
      );
    }

    // 3. Registro de Auditoría y Métricas
    await logEvent('ops.incident_acked', { 
      requestId, 
      incidentId: id, 
      actor,
      severity: data.severity,
      type: data.type
    });

    return NextResponse.json(
      { ok: true, id: data.id, status: 'acked', requestId }, 
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar ACK del incidente';

    await logEvent('api.error', { 
      requestId, 
      route: '/api/admin/ops/incidents/[id]/ack', 
      message: errorMessage,
      incidentId: id
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo interno al reconocer el incidente', requestId }, 
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}