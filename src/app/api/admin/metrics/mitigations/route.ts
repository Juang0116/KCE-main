// src/app/api/admin/metrics/mitigations/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { runMitigations } from '@/lib/mitigations.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Validación segura para Query Params (GET) transformando strings a booleanos reales
const QuerySchema = z.object({
  dryRun: z.string().optional().default('true').transform((v) => v !== 'false'),
});

// 2. Eliminamos .strict() para permitir JSON bodies resilientes (POST)
const BodySchema = z.object({
  fired: z.array(z.any()).default([]), // Si defines una interfaz estricta de alerta, cámbiala por z.object(...)
  dryRun: z.boolean().optional().default(true), // En un JSON Body (POST), los booleanos viajan como tipos nativos
});

export async function GET(req: NextRequest) {
  // Autenticación
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  // Parseo seguro y explícito de parámetros GET
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    dryRun: url.searchParams.get('dryRun') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Parámetros de consulta inválidos', issues: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) }
    );
  }

  // GET típico: devuelve estado o configuración sin aplicar mutaciones
  return NextResponse.json(
    { ok: true, dryRun: parsed.data.dryRun, message: "Use POST method to execute mitigations", requestId },
    { status: 200, headers: withRequestId(undefined, requestId) }
  );
}

export async function POST(req: NextRequest) {
  // Autenticación
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  // Parseo seguro del cuerpo de la petición
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Cuerpo de la petición inválido', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) }
    );
  }

  const { fired, dryRun } = parsed.data;

  try {
    // 3. Ejecución de la lógica de mitigación del sistema
    const mitigations = await runMitigations(fired, { dryRun, requestId });

    // 4. Registro de Auditoría (Ops Logging)
    await logEvent(
      'mitigations.run',
      { 
        requestId, 
        dryRun, 
        firedCount: fired.length, 
        mitigationsCount: mitigations?.length ?? 0 
      },
      { source: 'admin', dedupeKey: `mitigations_run:${requestId}` }
    );

    return NextResponse.json(
      { ok: true, dryRun, items: mitigations ?? [], requestId },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al ejecutar mitigaciones';
    
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/mitigations', message: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}