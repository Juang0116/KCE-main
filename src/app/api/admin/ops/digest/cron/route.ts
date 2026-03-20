// src/app/api/admin/ops/digest/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireInternalHmac } from '@/lib/internalHmac.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';
import { createOutboundMessage } from '@/lib/outbound.server';

// Agentes Autónomos
import { runOpsAgent } from '@/lib/opsAgent.server';
import { runReviewAgent } from '@/lib/reviewAgent.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(1),
  dryRun: z.coerce.boolean().default(false),
});

function getBearer(req: NextRequest): string {
  return (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  // 1. Autorización Multinivel (HMAC, Cron o Token)
  const hmacErr = await requireInternalHmac(req, { required: false });
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  const token = getBearer(req);
  const expected = (process.env.CRON_SECRET || process.env.CRON_API_TOKEN || '').trim();
  const bearerOk = expected && token === expected;

  if (hmacErr && !isVercelCron && !bearerOk) {
    return NextResponse.json(
      { ok: false, error: 'Acceso no autorizado al digest de operaciones', requestId },
      { status: 401, headers: withRequestId(undefined, requestId) }
    );
  }

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Servicio de base de datos no disponible', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Configuración de digest inválida', issues: parsed.error.issues, requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { days, dryRun } = parsed.data;
    const enabled = (process.env.OPS_DIGEST_ENABLED || '0').trim() !== '0';
    const to = (process.env.OPS_DIGEST_EMAIL_TO || process.env.OPS_ALERT_EMAIL_TO || '').trim();

    if (!enabled) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'Digest desactivado por configuración', requestId });
    }

    if (!to) {
      throw new Error('Falta destinatario para el digest (OPS_DIGEST_EMAIL_TO)');
    }

    const db = admin as any;
    const now = new Date();
    const fromISO = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

    // 2. Extracción Paralela de Datos de Salud (O(1) latencia)
    const [incRes, unresolvedRes, alertRes] = await Promise.all([
      db.from('ops_incidents').select('severity, status').gte('created_at', fromISO),
      db.from('ops_incidents').select('id', { count: 'exact', head: true }).in('status', ['open', 'acked']),
      db.from('crm_alerts').select('severity').gte('fired_at', fromISO).limit(200)
    ]);

    // 3. Procesamiento de Métricas
    const counts = { info: 0, warn: 0, critical: 0, open: 0, acked: 0, resolved: 0 };
    (incRes.data || []).forEach((r: any) => {
      const sev = String(r.severity || 'info').toLowerCase();
      const st = String(r.status || 'open').toLowerCase();
      if (sev in counts) (counts as any)[sev]++;
      if (st in counts) (counts as any)[st]++;
    });

    const alertCounts = { info: 0, warn: 0, critical: 0 };
    (alertRes.data || []).forEach((a: any) => {
      const s = String(a.severity || 'warn').toLowerCase();
      if (s in alertCounts) (alertCounts as any)[s]++;
    });

    // 4. Generación del Reporte (Markdown)
    const subjectPrefix = (process.env.OPS_DIGEST_SUBJECT_PREFIX || '[KCE Ops]').trim();
    const subject = `${subjectPrefix} Resumen Operativo ${now.toISOString().slice(0, 10)} (Ventana: ${days}d)`;
    
    const bodyMarkdown = [
      `# Resumen Operativo (Últimos ${days} día${days === 1 ? '' : 's'})`,
      `**Período:** ${fromISO} hasta ${now.toISOString()}`,
      '',
      `## Incidentes`,
      `- Total en ventana: **${(incRes.data || []).length}**`,
      `- Por severidad: Info: ${counts.info} | Warn: ${counts.warn} | **Critical: ${counts.critical}**`,
      `- Por estado: Open: ${counts.open} | Acked: ${counts.acked} | Resolved: ${counts.resolved}`,
      `- **Total Pendientes (Hoy): ${unresolvedRes.count || 0}**`,
      '',
      `## Alertas Disparadas`,
      `- Info: ${alertCounts.info} | Warn: ${alertCounts.warn} | Critical: ${alertCounts.critical}`,
      '',
      `## Acciones Recomendadas`,
      `1. Revisar incidentes no resueltos en el Panel de Ops.`,
      `2. Verificar alertas críticas disparadas recientemente.`,
      `3. Confirmar que los Agentes de IA procesaron las tareas pendientes.`,
    ].join('\n');

    // 5. Envío y Registro
    await logEvent('ops.digest.generated', { requestId, days, dryRun, unresolved: unresolvedRes.count });

    if (!dryRun) {
      await createOutboundMessage({
        channel: 'email',
        provider: 'system',
        status: 'queued',
        toEmail: to,
        subject,
        body: bodyMarkdown,
        metadata: { kind: 'ops_digest', days, fromISO },
      });
    }

    // 6. Despertar de Agentes (Aislado de la respuesta principal)
    let agentsResult = { ops: 0, reviews: 0 };
    if (!dryRun) {
      try {
        const ops = await runOpsAgent(requestId).catch(() => ({ processed: 0 }));
        const rev = await runReviewAgent(requestId).catch(() => ({ processed: 0 }));
        agentsResult = { ops: ops.processed, reviews: rev.processed };
      } catch (agentErr) {
        console.error('[KCE Agents] Error en ejecución de agentes:', agentErr);
      }
    }

    return NextResponse.json(
      { 
        ok: true, 
        requestId, 
        delivered: !dryRun, 
        summary: { incidents: counts, alerts: alertCounts, unresolved: unresolvedRes.count },
        agents: agentsResult 
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al generar digest';
    
    await logEvent('api.error', { requestId, route: '/api/admin/ops/digest', message: errorMessage });

    return NextResponse.json(
      { ok: false, error: 'Fallo al procesar el resumen operativo', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}