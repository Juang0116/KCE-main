// src/app/api/admin/reviews/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope, getAdminActor } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Esquema de validación para la búsqueda y paginación de reseñas.
 */
const QuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

/**
 * Recupera la lista de reseñas de KCE para moderación.
 * Gestiona la visibilidad y el filtrado por estado.
 */
export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  try {
    // 1. Seguridad: Solo administradores con acceso básico
    const auth = await requireAdminScope(req);
    if (!auth.ok) return auth.response;

    const actorRaw = await getAdminActor(req).catch(() => 'admin');
    const actor = String(actorRaw);

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: 'Servicio de base de datos no disponible', requestId },
        { status: 503, headers: withRequestId(undefined, requestId) }
      );
    }

    // 2. Validación de Parámetros de URL
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Parámetros de consulta inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { status, limit, page } = parsed.data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 3. Construcción de Consulta en Supabase
    let query = admin
      .from('reviews')
      .select(
        'id, tour_slug, tour_id, rating, title, body, comment, customer_name, customer_email, avatar_url, media_urls, status, approved, published_at, created_at',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    // Manejo de estados (incluyendo filas legacy sin status definido)
    if (status === 'pending') {
      query = query.or('status.eq.pending,status.is.null');
    } else {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // 4. Registro de Auditoría
    await logEvent('reviews.list_viewed', { 
      requestId, 
      actor, 
      status, 
      page, 
      resultsCount: (data ?? []).length 
    });

    // 5. Respuesta Paginada
    return NextResponse.json(
      { 
        ok: true,
        items: data ?? [], 
        pagination: {
          page, 
          limit, 
          total: count ?? 0,
          pages: count ? Math.ceil(count / limit) : 0
        },
        requestId 
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: any) {
    const msg = error instanceof Error ? error.message : 'Error desconocido al listar reseñas';
    
    await logEvent('api.error', { 
      requestId, 
      route: 'admin.reviews.list', 
      message: msg 
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo al recuperar la lista de moderación', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}