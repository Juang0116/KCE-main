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
  q: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  // 1. Autorización: Solo para ojos administrativos
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      q: url.searchParams.get('q') ?? undefined,
      country: url.searchParams.get('country') ?? undefined,
      language: url.searchParams.get('language') ?? undefined,
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros de búsqueda inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { q, country, language, page, limit } = parsed.data;
    
    // 2. Cálculo de rango para Supabase (Pagination)
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Supabase admin not configured');

    // 3. Construcción de la Query
    // Usamos 'exact' para que el frontend sepa cuántas páginas totales existen
    let query = (admin as any)
      .from('customers')
      .select('id, email, name, phone, country, language, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (country) query = query.eq('country', country);
    if (language) query = query.eq('language', language);

    if (q?.trim()) {
      const searchTerm = q.trim();
      // Búsqueda global en columnas críticas
      query = query.or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      // SOLUCIÓN ERROR 2379: userId con null coalescing
      void logEvent(
        'api.error', 
        { route: 'admin.customers.list', message: error.message, requestId }, 
        { userId: auth.actor ?? null, source: 'api' }
      );
      return NextResponse.json({ error: 'Error de base de datos', requestId }, { status: 500 });
    }

    // 4. Respuesta paginada
    return NextResponse.json(
      { 
        items: data ?? [], 
        page, 
        limit, 
        total: count ?? 0, 
        requestId 
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (err: any) {
    void logEvent(
      'api.error', 
      { route: 'admin.customers.fatal', message: err.message, requestId }, 
      { userId: auth.actor ?? null, source: 'api' }
    );
    return NextResponse.json(
      { error: 'Error interno del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}