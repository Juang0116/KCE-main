import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { runOpsAgent } from '@/lib/opsAgent.server';
import { runReviewAgent } from '@/lib/reviewAgent.server';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  agent: z.enum(['ops', 'review', 'all']),
  dryRun: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  // 1. Verificación de Seguridad (Admin Only)
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  // 2. Validación de Entrada
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Cuerpo de solicitud inválido', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const { agent, dryRun } = parsed.data;
  const results: Record<string, any> = {};

  // 3. Ejecución de Tareas
  if (!dryRun) {
    // Ejecutamos en paralelo para optimizar el tiempo de respuesta
    const tasks: Promise<void>[] = [];

    if (agent === 'ops' || agent === 'all') {
      tasks.push(
        runOpsAgent(requestId)
          .then(res => { results.ops = res; })
          .catch(e => { results.ops = { error: e?.message || 'Error en OpsAgent' }; })
      );
    }

    if (agent === 'review' || agent === 'all') {
      tasks.push(
        runReviewAgent(requestId)
          .then(res => { results.review = res; })
          .catch(e => { results.review = { error: e?.message || 'Error en ReviewAgent' }; })
      );
    }

    await Promise.all(tasks);

    // Registro de auditoría
    if (auth.ok && auth.actor) {
      void logEvent('admin.manual_agent_trigger', { agent, resultsCount: Object.keys(results).length }, { userId: auth.actor });
    }
  } else {
    // Modo Simulación (Dry Run)
    results.dryRun = true;
    results.message = `Simulación completada para: ${agent}. No se ejecutaron acciones reales.`;
  }

  return NextResponse.json(
    { ok: true, requestId, results },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}