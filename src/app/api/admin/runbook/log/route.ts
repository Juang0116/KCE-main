// src/app/api/admin/qa/runbook/step/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope, getAdminActor } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  runId: z.string().min(6, "ID de ejecución demasiado corto"),
  stepId: z.string().min(2, "ID de paso inválido"),
  status: z.enum(['todo', 'pass', 'fail']),
  notes: z.string().trim().max(2000).optional(),
}).strict();

/**
 * Registra el resultado de un paso individual en un runbook de QA.
 * Útil para auditorías de despliegue y control de calidad manual.
 */
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  // 1. Seguridad: Solo administradores con acceso básico
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  try {
    const actorRaw = await getAdminActor(req).catch(() => 'qa_executor');
    const actor = String(actorRaw);

    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Datos de paso inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { runId, stepId, status, notes } = parsed.data;

    // 2. Control de Spam / Deduplicación
    // Evitamos duplicar la misma transición de estado en el mismo run para el mismo paso.
    const dedupeKey = `runbook:${runId}:${stepId}:${status}`;

    // 3. Registro de Auditoría de QA
    await logEvent(
      'qa.runbook_step_recorded',
      {
        requestId,
        runId,
        stepId,
        status,
        actor,
        notes: notes || ''
      },
      { 
        source: 'qa', 
        entityId: runId, 
        dedupeKey 
      }
    );

    return NextResponse.json(
      { ok: true, requestId, status, stepId },
      { 
        status: 200, 
        headers: withRequestId({ 'Cache-Control': 'no-store' }, requestId) 
      }
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error en registro de runbook';
    
    await logEvent('api.error', { 
      requestId, 
      route: 'qa.runbook.step', 
      message: msg 
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo al registrar el progreso del runbook', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}