// src/app/api/health/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { serverEnv } from '@/lib/env';
import { requireHealthcheckAccess } from '@/lib/healthAuth.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { pruneExpiredChannelPauses } from '@/lib/channelPause.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CheckResult = { ok: boolean; error?: string };

async function checkSupabase(): Promise<CheckResult> {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return { ok: false, error: 'supabase_admin_unavailable' };
    const res = await (admin as any).from('event_locks').select('key').limit(1);
    if (res?.error) return { ok: false, error: res.error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET(req: NextRequest) {
  const gate = requireHealthcheckAccess(req);
  if (gate) return gate;

  const requestId = getRequestId(req.headers);

  // Best-effort housekeeping (keeps pause table small).
  const prunedPauses = await pruneExpiredChannelPauses();

  const checks: Record<string, CheckResult> = {
    env_stripe: { ok: Boolean((serverEnv.STRIPE_SECRET_KEY || '').trim()) },
    env_resend: { ok: Boolean((serverEnv.RESEND_API_KEY || '').trim()) },
    env_supabase_admin: { ok: Boolean((serverEnv.SUPABASE_SERVICE_ROLE_KEY || '').trim()) },
    supabase: await checkSupabase(),
  };

  const ok = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      ok,
      requestId,
      ts: new Date().toISOString(),
      prunedPauses,
      checks,
    },
    { status: ok ? 200 : 500, headers: withRequestId(undefined, requestId) },
  );
}
