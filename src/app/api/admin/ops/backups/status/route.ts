// src/app/api/admin/ops/backups/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminCapability } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Recupera el historial reciente de logs de backup para auditoría administrativa.
 * Proporciona visibilidad sobre la salud de la infraestructura de KCE.
 */
export async function GET(req: NextRequest) {
  // 1. Identificación y Seguridad
  const requestId = getRequestId(req.headers) || getRequestId(req as any);
  const auth = await requireAdminCapability(req, 'ops.read');
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Servicio de administración de base de datos no disponible', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 2. Consulta de logs (Bypass temporal de tipos para tablas Ops nuevas)
    const db = admin as any;
    const { data, error: dbError } = await db
      .from('ops_backups_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // 3. Manejo de errores de base de datos
    if (dbError) {
      await logEvent('api.error', {
        requestId,
        route: '/api/admin/ops/backups',
        message: `Fallo al recuperar logs de backup: ${dbError.message}`
      });

      return NextResponse.json(
        { ok: false, error: 'Error al consultar el historial de backups', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) }
      );
    }

    // 4. Respuesta exitosa con datos hidratados
    return NextResponse.json(
      { 
        ok: true, 
        requestId, 
        items: data ?? [] 
      }, 
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido en la ruta de backups';

    // Registro de excepción no controlada
    await logEvent('api.error', {
      requestId,
      route: '/api/admin/ops/backups',
      message: errorMessage
    });

    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}