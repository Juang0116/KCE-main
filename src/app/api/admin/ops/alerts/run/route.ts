// src/app/api/admin/ops/alerts/run/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope, getAdminActor } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { verifyAndConsumeAdminActionToken } from '@/lib/signedActions.server';
import { evaluateAlerts } from '@/lib/alerting.server';
import { runMitigations } from '@/lib/mitigations.server';
import { checkIncidentSla } from '@/lib/incidentSla.server';
import { checkPerfBudgets } from '@/lib/perfBudgets.server';
import { checkBackupAndDr } from '@/lib/backupDrChecks.server';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Determina el nivel de exigencia para acciones administrativas firmadas.
 */
function effectiveSignedMode(): 'off' | 'soft' | 'required' {
  const mode = (process.env.SIGNED_ACTIONS_MODE || '').trim() as any;
  if (mode === 'off' || mode === 'soft' || mode === 'required') return mode;
  return process.env.NODE_ENV === 'production' ? 'required' : 'soft';
}

type SignedErr = { code?: string; message: string };

type AdminMutationOk = {
  ok: true;
  actor: string;
  signedMode: 'off' | 'soft' | 'required';
  signedOk: boolean;
  signedError?: SignedErr; // Omitir si es undefined
};

type AdminMutationFail = { ok: false; res: NextResponse };
type AdminMutationResult = AdminMutationOk | AdminMutationFail;

/**
 * Valida la identidad del administrador y la firma de la acción (si aplica).
 */
async function requireAdminMutation(req: NextRequest): Promise<AdminMutationResult> {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return { ok: false, res: auth.response };

  const actor = await getAdminActor(req);
  const mode = effectiveSignedMode();

  let signedOk = true;
  let signedError: SignedErr | null = null;

  if (mode !== 'off') {
    const tok = (req.headers.get('x-admin-action-token') || '').trim();

    if (!tok) {
      signedOk = false;
      signedError = { message: 'Falta el encabezado x-admin-action-token' };

      if (mode === 'required') {
        return {
          ok: false,
          res: NextResponse.json({ ok: false, error: 'Acción rechazada: Se requiere token de firma' }, { status: 401 }),
        };
      }
    } else {
      const v = await verifyAndConsumeAdminActionToken(tok);
      if (!v.ok) {
        signedOk = false;
        signedError = { code: v.code, message: v.message };

        if (mode === 'required') {
          return {
            ok: false,
            res: NextResponse.json({ ok: false, error: v.message, code: v.code }, { status: 401 }),
          };
        }
      }
    }
  }

  // Construcción limpia del objeto para respetar tipos opcionales exactos
  const base: AdminMutationOk = {
    ok: true,
    actor,
    signedMode: mode,
    signedOk,
  };
  
  if (signedError) base.signedError = signedError;
  return base;
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  // 1. Validación de mutación administrativa (Seguridad de Firma)
  const m = await requireAdminMutation(req);
  if (!m.ok) return m.res;

  const body = (await req.json().catch(() => ({}))) as any;
  const dryRun = Boolean(body?.dryRun);

  try {
    // 2. Registro de inicio de auditoría operativa
    await logEvent('ops.alerts.run', { requestId, actor: m.actor, dryRun });

    // 3. Orquestación Paralela y Secuencial
    // Primero evaluamos y mitigamos alertas críticas
    const alerts = await evaluateAlerts({ dryRun, requestId });
    const mitigations = await runMitigations(alerts as any, { dryRun, requestId });

    // Verificaciones de cumplimiento y salud de infraestructura
    const [incidentSla, perfBudget, backupDr] = await Promise.all([
      checkIncidentSla(req, { dryRun, requestId }),
      checkPerfBudgets(req, 7), // Ventana de 7 días
      checkBackupAndDr(req)
    ]);

    // 4. Registro de finalización con resumen de salud
    await logEvent('ops.alerts.done', {
      requestId,
      actor: m.actor,
      dryRun,
      alertCount: Array.isArray((alerts as any)?.items) ? (alerts as any).items.length : 0,
      perfOk: perfBudget.ok,
      backupsOk: backupDr.backups.ok,
      drOk: backupDr.dr.ok,
      signedMode: m.signedMode,
      signedOk: m.signedOk,
      signedError: m.signedError?.message,
    });

    // Encabezado de advertencia para el modo 'soft'
    const extraHeaders: Record<string, string> = {};
    if (m.signedMode === 'soft' && !m.signedOk) {
      extraHeaders['x-admin-signed-actions'] = `soft-fail:${m.signedError?.code || 'invalid'}`;
    }

    const signedPayload = m.signedError
      ? { mode: m.signedMode, ok: m.signedOk, error: m.signedError }
      : { mode: m.signedMode, ok: m.signedOk };

    // 5. Respuesta consolidada de salud operativa
    return NextResponse.json(
      {
        ok: true,
        requestId,
        actor: m.actor,
        signed: signedPayload,
        alerts,
        mitigations,
        incidentSla,
        perfBudget,
        backupDr,
      },
      { 
        status: 200, 
        headers: withRequestId(Object.keys(extraHeaders).length ? extraHeaders : undefined, requestId) 
      },
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al ejecutar alertas de ops';

    await logEvent('api.error', { 
      requestId, 
      where: 'ops.alerts.run', 
      error: errorMessage,
      actor: m.actor 
    });

    return NextResponse.json(
      { ok: false, requestId, error: 'Fallo crítico al ejecutar el orquestador de operaciones.' },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}