// src/app/api/admin/metrics/deals/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DealRow = {
  id: string;
  stage: string | null;
  created_at: string | null;
  updated_at: string | null;
  closed_at: string | null;
  amount_minor: number | null;
  currency: string | null;
};

// Tipado estricto para los estados del Pipeline
const STAGES = ['new', 'qualified', 'proposal', 'checkout', 'won', 'lost'] as const;
type Stage = (typeof STAGES)[number];

function isStage(x: unknown): x is Stage {
  return typeof x === 'string' && (STAGES as readonly string[]).includes(x);
}

export async function GET(req: NextRequest) {
  // 1. Autenticación y configuración inicial
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  // Validación de seguridad contra fallos de entorno
  if (!admin) {
    return NextResponse.json(
      { error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // Alias local para el bypass del tipado estricto (hasta que 'deals' esté en la firma DB)
    const db = admin as any;

    // 2. Extracción de datos (Límite conservador para operaciones en memoria)
    const MAX_LIMIT = 5000;
    const { data: deals, error: dbError } = await db
      .from('deals')
      .select('id, stage, created_at, updated_at, closed_at, amount_minor, currency')
      .order('created_at', { ascending: false })
      .limit(MAX_LIMIT);

    if (dbError) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/metrics/deals', message: dbError.message },
        { source: 'api' }
      );
      return NextResponse.json(
        { error: 'Error en la base de datos al recuperar tratos', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) }
      );
    }

    const rows = (deals ?? []) as DealRow[];

    // 3. Alerta operativa de escalabilidad
    // Si llegamos a 5000 tratos, hay que avisarle a Ops que debemos migrar esto a una RPC en Postgres
    if (rows.length >= MAX_LIMIT) {
      await logEvent(
        'metrics.fallback_truncated',
        { requestId, eventCount: rows.length, aggregator: 'deals-pipeline' },
        { source: 'system' }
      );
    }

    // 4. Agregación en memoria (O(N))
    const totalsByStage: Record<string, number> = {};
    const amountByStageMinor: Record<string, number> = {};
    
    // Inicializar contadores en cero para garantizar consistencia en la UI
    for (const s of STAGES) {
      totalsByStage[s] = 0;
      amountByStageMinor[s] = 0;
    }

    let wonCount = 0;
    let wonAmountMinor = 0;

    for (const d of rows) {
      const stage = isStage(d.stage) ? d.stage : 'new'; // Fallback a 'new' si el stage está corrupto
      
      const amt = typeof d.amount_minor === 'number' ? d.amount_minor : 0;

      // Acumuladores globales
      totalsByStage[stage] = (totalsByStage[stage] ?? 0) + 1;
      amountByStageMinor[stage] = (amountByStageMinor[stage] ?? 0) + amt;

      // Acumuladores específicos de éxito
      if (stage === 'won') {
        wonCount += 1;
        wonAmountMinor += amt;
      }
    }

    // 5. Respuesta formateada
    return NextResponse.json(
      {
        requestId,
        window: { items_considered: rows.length, limit: MAX_LIMIT },
        totalsByStage,
        amountByStageMinor,
        won: { count: wonCount, amount_minor: wonAmountMinor },
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al calcular métricas de Deals';
    
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/deals', message: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}