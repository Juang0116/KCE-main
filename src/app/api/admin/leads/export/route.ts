// src/app/api/admin/leads/export/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  stage: z.string().optional(),
  source: z.string().optional(),
  tags: z.string().optional(), // separados por coma
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(2000),
});

type LeadRow = {
  id: string;
  email: string | null;
  whatsapp: string | null;
  source: string | null;
  language: string | null;
  stage: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
};

/**
 * Escapa valores para CSV. Maneja nulos y previene 
 * inyecciones de comillas o saltos de línea.
 */
function toCsvValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[\n\r",]/.test(s)) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

function splitTags(v?: string): string[] {
  if (!v) return [];
  return v
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export async function GET(req: NextRequest) {
  // 1. Autenticación y configuración de logs
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  // 2. Control de abusos (Rate Limiting)
  const rl = await checkRateLimit(req, {
    action: 'admin.export.leads',
    limit: 10,
    windowSeconds: 60,
    identity: 'ip+vid',
    failOpen: true,
  });

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes de exportación', code: 'RATE_LIMIT', retryAfterSeconds: rl.retryAfterSeconds ?? 60, requestId },
      { status: 429, headers: withRequestId({ 'Retry-After': String(rl.retryAfterSeconds ?? 60) }, requestId) }
    );
  }

  try {
    // 3. Parseo y validación de parámetros de búsqueda
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      stage: url.searchParams.get('stage') ?? undefined,
      source: url.searchParams.get('source') ?? undefined,
      tags: url.searchParams.get('tags') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros de búsqueda inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { stage, source, tags, q, limit } = parsed.data;

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: 'Cliente Supabase de administrador no configurado', requestId },
        { status: 503, headers: withRequestId(undefined, requestId) }
      );
    }

    // 4. Construcción de la consulta dinámica
    const db = admin as any; // Workaround temporal para tipos "never"
    const safeLimit = Math.max(1, Math.min(5000, limit));

    let query = db
      .from('leads')
      .select('id, email, whatsapp, source, language, stage, tags, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (stage) query = query.eq('stage', stage);
    if (source) query = query.eq('source', source);

    const tagList = splitTags(tags);
    if (tagList.length > 0) {
      query = query.contains('tags', tagList);
    }

    if (q?.trim()) {
      const qq = q.trim();
      query = query.or(`email.ilike.%${qq}%,whatsapp.ilike.%${qq}%`);
    }

    // 5. Ejecución de la consulta
    const { data, error: dbError } = await query;

    if (dbError) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/leads/export', message: dbError.message },
        { source: 'api' }
      );
      return NextResponse.json(
        { error: 'Error al consultar la base de datos', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) }
      );
    }

    // 6. Transformación a formato CSV
    const headers = [
      'id',
      'email',
      'whatsapp',
      'source',
      'language',
      'stage',
      'tags',
      'notes',
      'created_at',
    ];

    const rows = (data as LeadRow[] ?? []).map((r) => [
      toCsvValue(r.id),
      toCsvValue(r.email),
      toCsvValue(r.whatsapp),
      toCsvValue(r.source),
      toCsvValue(r.language),
      toCsvValue(r.stage),
      toCsvValue(Array.isArray(r.tags) ? r.tags.join('|') : ''),
      toCsvValue(r.notes),
      toCsvValue(r.created_at),
    ].join(','));

    // Agregamos BOM (\uFEFF) para compatibilidad nativa con Excel en codificación UTF-8
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

    // 7. Registro de auditoría
    await logEvent(
      'export.csv',
      { request_id: requestId, entity: 'leads', count: rows.length },
      { source: 'admin', dedupeKey: `export:leads:${requestId}` }
    );

    // 8. Respuesta con cabeceras de descarga de archivo
    const dateStr = new Date().toISOString().slice(0, 10);
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: withRequestId(
        {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="kce_leads_${dateStr}.csv"`,
          'Cache-Control': 'no-store',
        },
        requestId
      ),
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al exportar leads';
    
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/leads/export', message: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}