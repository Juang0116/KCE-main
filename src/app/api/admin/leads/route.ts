// src/app/api/admin/leads/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  stage: z.string().optional(),
  source: z.string().optional(),
  tags: z.string().optional(), // separados por comas
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

/**
 * Normaliza y separa una cadena de tags, limitando a 10 para 
 * evitar consultas excesivamente pesadas.
 */
function splitTags(v?: string): string[] {
  if (!v) return [];
  return v
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export async function GET(req: NextRequest) {
  // 1. Autenticación y configuración inicial
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
    // 2. Parseo y validación segura de parámetros de URL
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      stage: url.searchParams.get('stage') ?? undefined,
      source: url.searchParams.get('source') ?? undefined,
      tags: url.searchParams.get('tags') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { stage, source, tags, q, page, limit } = parsed.data;
    
    // Cálculo seguro de rangos para la paginación de Supabase
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 3. Construcción dinámica de la consulta (Query Builder)
    const db = admin as any; // Workaround temporal para tipos estables
    
    let query = db
      .from('leads')
      .select('id, email, whatsapp, source, language, customer_id, stage, tags, notes, created_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(from, to);

    // Aplicar filtros condicionales
    if (stage) query = query.eq('stage', stage);
    if (source) query = query.eq('source', source);

    const tagList = splitTags(tags);
    if (tagList.length > 0) {
      query = query.contains('tags', tagList);
    }

    // Búsqueda de texto libre (Email o WhatsApp)
    if (q?.trim()) {
      const searchQuery = q.trim();
      query = query.or(`email.ilike.%${searchQuery}%,whatsapp.ilike.%${searchQuery}%`);
    }

    // 4. Ejecución de la consulta
    const { data, count, error: dbError } = await query;

    if (dbError) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/leads', message: dbError.message },
        { source: 'api' }
      );
      return NextResponse.json(
        { error: 'Error al consultar la base de datos', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) }
      );
    }

    // 5. Respuesta exitosa
    return NextResponse.json(
      { 
        items: data ?? [], 
        page, 
        limit, 
        total: count ?? null, 
        requestId 
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener leads';
    
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/leads', message: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}