// src/app/api/admin/metrics/funnel-stages/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { computeFunnelStages } from '@/lib/funnelStages.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Eliminamos .strict() para evitar fallos si el frontend o herramientas 
// de analítica envían parámetros extra en la URL (ej. ?_r=12345 o tags)
const QuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
  limit: z.coerce.number().int().min(50).max(5000).default(1000),
  openWindowDays: z.coerce.number().int().min(1).max(30).default(14),
});

export async function GET(req: NextRequest) {
  // 2. Autenticación y configuración inicial
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    // 3. Parseo explícito y seguro de la URL (evitamos Object.fromEntries)
    const parsed = QuerySchema.safeParse({
      days: req.nextUrl.searchParams.get('days') ?? undefined,
      limit: req.nextUrl.searchParams.get('limit') ?? undefined,
      openWindowDays: req.nextUrl.searchParams.get('openWindowDays') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    // 4. Delegación de la lógica de procesamiento (Servicio)
    const data = await computeFunnelStages(parsed.data);

    return NextResponse.json(
      { ...data, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    // 5. Manejo seguro y estandarizado de excepciones
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al calcular etapas del embudo';

    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/funnel-stages', message: errorMessage },
      { source: 'api' }
    );

    return NextResponse.json(
      { error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}