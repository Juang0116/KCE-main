// src/app/api/admin/metrics/alerts/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { evaluateAlerts } from '@/lib/alerting.server';
import { logEvent } from '@/lib/events.server';
import { runMitigations } from '@/lib/mitigations.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Esquema de validación seguro para Query Params
const QuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(180).default(14),
  // Transformamos strings a booleanos reales evitando el bug de Boolean("false") === true
  run: z.string().optional().transform((v) => v === '1' || v === 'true'),
  dryRun: z.string().optional().default('true').transform((v) => v !== 'false'),
});

export async function GET(req: NextRequest) {
  // 2. Autenticación y configuración
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

  // 3. Parseo explícito y seguro de la URL
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    days: url.searchParams.get('days') ?? undefined,
    run: url.searchParams.get('run') ?? undefined,
    dryRun: url.searchParams.get('dryRun') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Parámetros de consulta inválidos', issues: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) }
    );
  }

  const { days, run, dryRun } = parsed.data;

  let fired: any[] = [];
  let mitigations: any[] = [];

  // 4. Ejecución manual (On-Demand) si se solicitó
  if (run) {
    try {
      fired = await evaluateAlerts({ dryRun, requestId });
      mitigations = await runMitigations(fired as any, { dryRun, requestId });

      // Auditoría: Registrar que se forzó una ejecución manual
      await logEvent(
        'alerts.manual_run',
        { requestId, dryRun, firedCount: fired.length, mitigationsCount: mitigations.length },
        { source: 'admin', dedupeKey: `alerts:manual_run:${requestId}` }
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al ejecutar alertas';
      
      await logEvent(
        'api.error',
        { requestId, where: 'alerts.run', error: errorMessage },
        { source: 'api' }
      );
      // Nota: No retornamos error HTTP 500 aquí para permitir que 
      // la UI al menos cargue el historial de alertas en el paso 5.
    }
  }

  // 5. Consulta del historial reciente de alertas
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const db = admin as any; // Workaround temporal para tipos "never"

  try {
    const { data: items, error: dbError } = await db
      .from('crm_alerts')
      .select('id, type, severity, message, meta, created_at, acknowledged_at, acknowledged_by')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(200);

    if (dbError) {
      throw new Error(dbError.message);
    }

    return NextResponse.json(
      { ok: true, requestId, fired, mitigations, items: items ?? [] },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener historial';

    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/alerts', error: errorMessage },
      { source: 'api' }
    );

    return NextResponse.json(
      { ok: false, error: 'Error en la base de datos al recuperar alertas', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}