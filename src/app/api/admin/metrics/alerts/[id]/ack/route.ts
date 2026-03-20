// src/app/api/admin/metrics/alerts/[id]/ack/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Esquema de validación para los parámetros de la URL
const ParamsSchema = z.object({
  id: z.string().uuid({ message: "El ID de la alerta debe ser un UUID válido" }),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  
  // 2. Validación de permisos granulares (RBAC)
  const auth = await requireAdminCapability(req, 'alerts_ack');
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 3. Validación segura del ID
    const resolvedParams = await ctx.params;
    const parsedParams = ParamsSchema.safeParse(resolvedParams);

    if (!parsedParams.success) {
      return NextResponse.json(
        { ok: false, error: 'ID de alerta inválido', details: parsedParams.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { id } = parsedParams.data;
    const db = admin as any; // Workaround temporal para tipos "never"

    // 4. Ejecución en la base de datos
    const nowIso = new Date().toISOString();
    const { data: item, error: dbError } = await db
      .from('crm_alerts')
      .update({ acknowledged_at: nowIso, acknowledged_by: auth.mode })
      .eq('id', id)
      .select('id, acknowledged_at, acknowledged_by')
      .single();

    if (dbError) {
      await logEvent(
        'api.error', 
        { 
          requestId, 
          route: '/api/admin/metrics/alerts/[id]/ack', 
          supabase: { message: dbError.message, code: dbError.code },
          alertId: id
        },
        { source: 'api' }
      );
      return NextResponse.json(
        { ok: false, error: 'Error en la base de datos al confirmar la alerta', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) }
      );
    }

    // 5. Registro de auditoría operativa exitosa
    await logEvent(
      'alert.acknowledged',
      { requestId, alertId: id, acknowledgedBy: auth.mode },
      { source: 'admin', entityId: id, dedupeKey: `alert:ack:${id}` }
    );

    return NextResponse.json(
      { ok: true, requestId, item },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    await logEvent(
      'api.error', 
      { requestId, route: '/api/admin/metrics/alerts/[id]/ack', error: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { ok: false, error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}