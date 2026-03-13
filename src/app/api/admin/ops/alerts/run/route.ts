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
  signedError?: SignedErr; // IMPORTANT: optional => must be omitted if undefined
};

type AdminMutationFail = { ok: false; res: NextResponse };

type AdminMutationResult = AdminMutationOk | AdminMutationFail;

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
      signedError = { message: 'Missing x-admin-action-token' };

      if (mode === 'required') {
        return {
          ok: false,
          res: NextResponse.json({ ok: false, error: 'Missing x-admin-action-token' }, { status: 401 }),
        };
      }
      // soft mode: allow request but report signedOk=false
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
        // soft mode: allow request but report signedOk=false
      }
    }
  }

  // IMPORTANT: omit signedError when null to satisfy exactOptionalPropertyTypes
  const base: AdminMutationOk = {
    ok: true,
    actor,
    signedMode: mode,
    signedOk,
  };
  return signedError ? { ...base, signedError } : base;
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const m = await requireAdminMutation(req);
  if (!m.ok) return m.res;

  const body = (await req.json().catch(() => null)) as any;
  const dryRun = Boolean(body?.dryRun);

  try {
    await logEvent('ops.alerts.run', { requestId, actor: m.actor, dryRun });

    const alerts = await evaluateAlerts({ dryRun, requestId });
    const mitigations = await runMitigations(alerts as any, { dryRun, requestId });

    // checkIncidentSla expects (req, params)
    const incidentSla = await checkIncidentSla(req, { dryRun, requestId });
    const perfBudget = await checkPerfBudgets(req, 7);
    const backupDr = await checkBackupAndDr(req);

    await logEvent('ops.alerts.done', {
      requestId,
      actor: m.actor,
      dryRun,
      alertCount: Array.isArray((alerts as any)?.items) ? (alerts as any).items.length : undefined,
      perfOk: perfBudget.ok,
      backupsOk: backupDr.backups.ok,
      drOk: backupDr.dr.ok,
      signedMode: m.signedMode,
      signedOk: m.signedOk,
      signedError: m.signedError?.message,
    });

    const extraHeaders =
      m.signedMode === 'soft' && !m.signedOk
        ? { 'x-admin-signed-actions': `soft-fail:${m.signedError?.code || 'invalid'}` }
        : undefined;

    // IMPORTANT: do not include `error: null` if you keep it optional (same rule).
    const signedPayload = m.signedError
      ? { mode: m.signedMode, ok: m.signedOk, error: m.signedError }
      : { mode: m.signedMode, ok: m.signedOk };

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
      { status: 200, headers: withRequestId(extraHeaders, requestId) },
    );
  } catch (e: any) {
    await logEvent('api.error', { requestId, where: 'ops.alerts.run', error: String(e) });
    return NextResponse.json(
      { ok: false, requestId, error: 'Failed to run ops alerts.' },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
