// src/app/api/admin/metrics/alerts/cron/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { evaluateAlerts } from '@/lib/alerting.server';
import { runMitigations } from '@/lib/mitigations.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { requireInternalHmac } from '@/lib/internalHmac.server';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBearer(req: NextRequest) {
  const h = req.headers.get('authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m?.[1]?.trim() || '';
}

export async function GET(req: NextRequest) {
  // Accept Vercel cron header or Bearer token in addition to HMAC
  const hmacErr = await requireInternalHmac(req, { required: false });
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  const cronToken = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const cronSecret = (process.env.CRON_SECRET || process.env.CRON_API_TOKEN || '').trim();
  const bearerOk = cronSecret && cronToken === cronSecret;
  if (hmacErr && !isVercelCron && !bearerOk) return hmacErr;
  const requestId = getRequestId(req);
  const token = getBearer(req);
  const expected = (process.env.CRON_SECRET || '').trim();
  if (!expected || token !== expected) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized', requestId },
      { status: 401, headers: withRequestId(undefined, requestId) },
    );
  }

  const url = new URL(req.url);
  const dryRun = (url.searchParams.get('dryRun') || '').toLowerCase() === 'true';

  try {
    const alerts = await evaluateAlerts({ dryRun, requestId });
    const mitigations = await runMitigations(alerts as any, { dryRun, requestId });
    return NextResponse.json(
      { ok: true, requestId, alerts, mitigations },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e) {
    await logEvent('api.error', { requestId, where: 'alerts.cron', error: String(e) });
    return NextResponse.json(
      { ok: false, requestId, error: 'Failed', details: String(e) },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
