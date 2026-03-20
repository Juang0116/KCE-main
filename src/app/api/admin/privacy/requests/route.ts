// src/app/api/admin/privacy/requests/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope, getAdminActor } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Esquema para filtros de búsqueda
const QuerySchema = z.object({
  status: z.enum(['open', 'in_progress', 'done', 'rejected']).optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
});

/**
 * Recupera la lista de solicitudes de privacidad de Knowing Cultures Enterprise.
 * Soporta filtrado por estado para facilitar la gestión del equipo de cumplimiento.
 */
export async function GET(req: NextRequest) {
  const requestId = (getRequestId(req.headers) || `req_gen_${Date.now().toString(36)}`).trim();
  
  // 2. Seguridad: Requiere capacidad de visualización del sistema
  const auth = await requireAdminScope(req, 'system_view');
  if (!auth.ok) return auth.response;

  const actorRaw = await getAdminActor(req).catch(() => 'admin');
  const actor = String(actorRaw);

  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { ok: false, error: 'Infraestructura de base de datos no disponible', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 3. Validación de Parámetros de URL
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Filtros de búsqueda inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { status, limit } = parsed.data;
    const db = sb as any; // Cast puntual para tablas de sistema

    // 4. Construcción dinámica de la consulta
    let query = db
      .from('privacy_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error: dbError } = await query;

    if (dbError) throw dbError;

    // 5. Registro de Auditoría
    await logEvent('privacy.requests.listed', {
      requestId,
      actor,
      filterStatus: status ?? 'all',
      count: (data ?? []).length
    });

    return NextResponse.json(
      { ok: true, items: data ?? [], requestId },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido al listar solicitudes';
    
    await logEvent('api.error', { 
      requestId, 
      route: 'privacy.requests.list', 
      message: msg 
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo al recuperar las solicitudes de privacidad', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}