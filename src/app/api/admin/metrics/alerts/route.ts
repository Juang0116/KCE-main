// src/app/api/admin/metrics/alerts/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { evaluateAlerts } from '@/lib/alerting.server';
import { runMitigations } from '@/lib/mitigations.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(180).default(14),
  run: z.coerce.number().int().optional(), // ?run=1 to evaluate now
  dryRun: z.coerce.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid query', issues: parsed.error.issues, requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Supabase admin not configured', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  const days = parsed.data.days;
  const run = Boolean(parsed.data.run);
  const dryRun = parsed.data.dryRun;

  let fired: any[] = [];
  let mitigations: any[] = [];

  if (run) {
    try {
      fired = await evaluateAlerts({ dryRun, requestId });
      mitigations = await runMitigations(fired as any, { dryRun, requestId });
    } catch (e) {
      await logEvent(
        'api.error',
        { requestId, where: 'alerts.run', error: e instanceof Error ? e.message : String(e) },
        { source: 'api' },
      );
    }
  }

  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const res = await (admin as any)
    .from('crm_alerts')
    .select('id,type,severity,message,meta,created_at,acknowledged_at,acknowledged_by')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(200);

  if (res.error) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/metrics/alerts',
        supabase: { message: res.error.message, code: res.error.code },
      },
      { source: 'api' },
    );

    return NextResponse.json(
      { ok: false, error: 'DB error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, requestId, fired, mitigations, items: res.data ?? [] },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
