// src/app/api/admin/metrics/page-blocks/route.ts
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
  days: z.coerce.number().int().min(1).max(180).default(30),
  limit: z.coerce.number().int().min(100).max(50000).default(20000),
});

type EventRow = {
  type: string;
  created_at: string;
  payload: any;
};

/**
 * Extrae y limpia strings de los payloads JSON de forma segura.
 */
function safeStr(v: any, max = 80): string {
  const s = typeof v === 'string' ? v : '';
  return s.trim().slice(0, max);
}

export async function GET(req: NextRequest) {
  // 1. Autenticación y contexto
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 2. Parseo y validación de parámetros de URL
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      days: url.searchParams.get('days') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Parámetros de consulta inválidos', issues: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { days, limit } = parsed.data;
    const to = new Date();
    const from = new Date(to.getTime() - days * 86400000);

    const db = admin as any; // Workaround temporal para tipos "never"

    // 3. Extracción masiva de eventos de UI
    const { data, error: dbError } = await db
      .from('events')
      .select('type, created_at, payload')
      .in('type', ['ui.block.view', 'ui.cta.click', 'ui.page.view'])
      .gte('created_at', from.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (dbError) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/metrics/page-blocks', message: dbError.message },
        { source: 'api' }
      );

      return NextResponse.json(
        { ok: false, error: 'Error en la base de datos al consultar eventos de UI', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) }
      );
    }

    const rows = (data ?? []) as EventRow[];

    // Alerta de escalabilidad si topamos el límite en memoria
    if (rows.length >= limit) {
      await logEvent(
        'metrics.fallback_truncated',
        { requestId, days, eventCount: rows.length, aggregator: 'page-blocks' },
        { source: 'system' }
      );
    }

    // 4. Agregación en memoria (O(N)) usando llave compuesta
    const byKey = new Map<
      string,
      { key: string; kind: string; page: string; block: string; label: string; count: number }
    >();

    for (const r of rows) {
      const kind = r.type;
      const p = (r.payload ?? {}) as any;

      const page = safeStr(p.page, 64) || 'unknown';
      const block = safeStr(p.block ?? p.cta ?? '', 64) || (kind === 'ui.page.view' ? 'page' : 'unknown');
      const label = safeStr(p.label ?? '', 64);

      const key = `${kind}|${page}|${block}|${label}`;
      const curr = byKey.get(key);
      
      if (curr) {
        curr.count += 1;
      } else {
        byKey.set(key, { key, kind, page, block, label, count: 1 });
      }
    }

    // 5. Ordenamiento y entrega de resultados
    const items = Array.from(byKey.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 500);

    return NextResponse.json(
      {
        ok: true,
        requestId,
        window: { from: from.toISOString(), to: to.toISOString(), days },
        items,
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al agrupar bloques de página';
    
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/page-blocks', message: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { ok: false, error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}