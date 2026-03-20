// src/app/api/admin/metrics/alerts/cron/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { evaluateAlerts } from '@/lib/alerting.server';
import { logEvent } from '@/lib/events.server';
import { requireInternalHmac } from '@/lib/internalHmac.server';
import { runMitigations } from '@/lib/mitigations.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Opcional: Si este proceso tarda, puedes añadir un maxDuration (ej. export const maxDuration = 60;)

// 1. Esquema de validación para parámetros de la URL
const QuerySchema = z.object({
  dryRun: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

export async function GET(req: NextRequest) {
  // Extraemos el requestId del req (como en el original, dependiendo de la firma del util)
  const requestId = getRequestId(req as any) || getRequestId(req.headers as any); 

  // 2. Autenticación Consolidada (Cron Secret o Internal HMAC)
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const cronSecret = (process.env.CRON_SECRET || process.env.CRON_API_TOKEN || '').trim();
  
  const hasValidToken = cronSecret && token === cronSecret;
  
  // Evaluamos HMAC (con required: false para que no bloquee directamente si no está, sino que nos devuelva el error)
  const hmacErr = await requireInternalHmac(req, { required: false });

  // Se permite el acceso si tiene un Token Válido O si la firma HMAC es correcta
  if (!hasValidToken && hmacErr) {
    await logEvent(
      'security.unauthorized',
      { requestId, route: 'alerts.cron', reason: 'Missing or invalid CRON_SECRET and HMAC' },
      { source: 'api' }
    );
    return NextResponse.json(
      { ok: false, error: 'Unauthorized: Invalid cron token or HMAC signature', requestId },
      { status: 401, headers: withRequestId(undefined, requestId) }
    );
  }

  // 3. Validación de parámetros de ejecución
  const url = new URL(req.url);
  const parsedParams = QuerySchema.safeParse({
    dryRun: url.searchParams.get('dryRun') ?? undefined,
  });

  if (!parsedParams.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid parameters', details: parsedParams.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) }
    );
  }

  const { dryRun } = parsedParams.data;

  try {
    // 4. Ejecución de la lógica de negocio (Alertas y Mitigaciones)
    const alerts = await evaluateAlerts({ dryRun, requestId });
    
    // Bypass temporal ('any') hasta que los tipos de alerts/mitigations estén alineados
    const mitigations = await runMitigations(alerts as any, { dryRun, requestId });

    // 5. Registro de auditoría de éxito del Cron
    await logEvent(
      'alerts.cron_executed',
      { 
        requestId, 
        dryRun, 
        alertsProcessed: Array.isArray(alerts) ? alerts.length : 0, 
        mitigationsRun: Array.isArray(mitigations) ? mitigations.length : 0 
      },
      { source: 'system', dedupeKey: `cron:alerts:${requestId}` }
    );

    return NextResponse.json(
      { ok: true, requestId, alerts, mitigations, dryRun },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown execution error';

    // 6. Manejo estandarizado de errores
    await logEvent(
      'api.error', 
      { requestId, where: 'alerts.cron', error: errorMessage },
      { source: 'api' }
    );

    return NextResponse.json(
      { ok: false, requestId, error: 'Cron execution failed', details: errorMessage },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}