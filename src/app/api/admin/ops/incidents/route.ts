// src/app/api/admin/ops/incidents/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Esquema de validación para filtros y paginación
const QuerySchema = z.object({
  status: z.string().trim().optional(),
  severity: z.string().trim().optional(),
  kind: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

/**
 * Recupera la lista de incidentes operativos con soporte para filtros.
 * Es la fuente de datos principal para el centro de mando de KCE.
 */
export async function GET(req: NextRequest) {
  // 2. Identificación y Seguridad
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Servicio de base de datos de administración no disponible', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 3. Parseo y Validación de Parámetros de URL
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      status: url.searchParams.get('status') ?? undefined,
      severity: url.searchParams.get('severity') ?? undefined,
      kind: url.searchParams.get('kind') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Parámetros de consulta inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { status, severity, kind, limit } = parsed.data;
    const db = admin as any; // Bypass temporal de tipos para tablas Ops

    // 4. Construcción de la Consulta Dinámica
    let query = db
      .from('ops_incidents')
      .select('id, request_id, severity, kind, actor, path, method, ip, user_agent, message, fingerprint, meta, status, count, first_seen_at, last_seen_at, acknowledged_at, resolved_at, created_at, updated_at')
      .order('last_seen_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);
    if (severity) query = query.eq('severity', severity);
    if (kind) query = query.eq('kind', kind);

    // 5. Ejecución y Manejo de Errores de BD
    const { data, error: dbError } = await query;

    if (dbError) {
      await logEvent('api.error', { 
        requestId, 
        route: '/api/admin/ops/incidents', 
        message: `Fallo en consulta de incidentes: ${dbError.message}` 
      });

      return NextResponse.json(
        { ok: false, error: 'Error al recuperar la lista de incidentes', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) }
      );
    }

    // 6. Respuesta Exitosa
    return NextResponse.json(
      { 
        ok: true, 
        requestId, 
        items: data ?? [],
        filters: { status, severity, kind, limit }
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al listar incidentes';

    await logEvent('api.error', { 
      requestId, 
      route: '/api/admin/ops/incidents', 
      message: errorMessage 
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo interno al procesar la lista de incidentes', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}