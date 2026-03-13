import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getAdminActor, requireAdminBasicAuth } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { notifyOps } from '@/lib/opsNotify.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Permitimos "error" en el request, pero lo mapeamos a "critical" porque NotifyPayload no acepta "error".
const BodySchema = z
  .object({
    title: z.string().trim().min(1).max(140),
    message: z.string().trim().min(1).max(5000),
    severity: z.enum(['info', 'warn', 'error', 'critical']).default('info'),
  })
  .strict();

function configured() {
  const email = String(process.env.OPS_NOTIFY_EMAIL || '').trim();
  const webhook = String(process.env.OPS_NOTIFY_WEBHOOK_URL || '').trim();
  return { email, webhook, ok: Boolean(email || webhook) };
}

function mapSeverity(
  s: 'info' | 'warn' | 'error' | 'critical',
): 'info' | 'warn' | 'critical' {
  if (s === 'error') return 'critical';
  return s;
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminBasicAuth(req);
  if (!auth.ok) return auth.response;

  const actor = (await getAdminActor(req)) || 'admin';

  const conf = configured();
  if (!conf.ok) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: 'OPS notify no configurado (OPS_NOTIFY_EMAIL o OPS_NOTIFY_WEBHOOK_URL).',
      },
      { status: 503, headers: withRequestId(undefined, requestId) },
    );
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Bad body', details: parsed.error.flatten() },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const sev = mapSeverity(parsed.data.severity);

  let delivered = true;
  try {
    // notifyOps en tu repo devuelve void/Promise<void>, así que medimos "delivered" por try/catch.
    await notifyOps({
      title: parsed.data.title,
      text: parsed.data.message,
      severity: sev,
      meta: { requestId, actor, test: true },
    });
  } catch (e) {
    delivered = false;

    // logEvent en tu repo espera (kind: string, payload: any, opts?: any), NO (req, ...)
    void logEvent(
      'ops_notify_test.error',
      {
        requestId,
        actor,
        message: e instanceof Error ? e.message : 'unknown',
      },
      { source: 'admin' },
    );
  }

  void logEvent(
    'ops_notify_test',
    {
      requestId,
      actor,
      delivered,
      severity: sev,
      configured: conf.ok,
    },
    { source: 'admin' },
  );

  return NextResponse.json(
    { ok: true, requestId, delivered },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
