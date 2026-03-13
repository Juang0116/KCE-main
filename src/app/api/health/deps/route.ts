// src/app/api/health/deps/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { serverEnv } from '@/lib/env';
import { requireHealthcheckAccess } from '@/lib/healthAuth.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DepCheck = {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  detail?: string;
  ms?: number;
};

async function withTimeout<T>(ms: number, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fn(ac.signal);
  } finally {
    clearTimeout(t);
  }
}

async function checkSupabase(): Promise<DepCheck> {
  const started = Date.now();
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return { ok: false, detail: 'supabase_admin_unavailable' };

    const res = await (admin as any).from('event_locks').select('key').limit(1);
    if (res?.error) return { ok: false, detail: res.error.message, ms: Date.now() - started };

    return { ok: true, ms: Date.now() - started };
  } catch (e) {
    return {
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
      ms: Date.now() - started,
    };
  }
}

async function checkStripe(): Promise<DepCheck> {
  const key = (serverEnv.STRIPE_SECRET_KEY || '').trim();
  if (!key) return { ok: false, skipped: true, detail: 'missing_STRIPE_SECRET_KEY' };

  const started = Date.now();
  try {
    const r = await withTimeout(2500, (signal) =>
      fetch('https://api.stripe.com/v1/account', {
        method: 'GET',
        headers: { authorization: `Bearer ${key}` },
        signal,
      }),
    );

    const ok = r.ok;

    // ✅ exactOptionalPropertyTypes: no incluir detail si no hay valor
    return {
      ok,
      status: r.status,
      ms: Date.now() - started,
      ...(ok ? {} : { detail: `stripe_${r.status}` }),
    };
  } catch (e) {
    return {
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
      ms: Date.now() - started,
    };
  }
}

async function checkResend(): Promise<DepCheck> {
  const key = (serverEnv.RESEND_API_KEY || '').trim();
  if (!key) return { ok: false, skipped: true, detail: 'missing_RESEND_API_KEY' };

  const started = Date.now();
  try {
    const r = await withTimeout(2500, (signal) =>
      fetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: { authorization: `Bearer ${key}` },
        signal,
      }),
    );

    const ok = r.ok;

    // ✅ exactOptionalPropertyTypes: no incluir detail si no hay valor
    return {
      ok,
      status: r.status,
      ms: Date.now() - started,
      ...(ok ? {} : { detail: `resend_${r.status}` }),
    };
  } catch (e) {
    return {
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
      ms: Date.now() - started,
    };
  }
}

export async function GET(req: NextRequest) {
  const gate = requireHealthcheckAccess(req);
  if (gate) return gate;

  const requestId = getRequestId(req.headers);
  const deep = req.nextUrl.searchParams.get('deep') === '1';

  // Shallow mode just checks env presence + Supabase ping.
  // Deep mode additionally calls Stripe/Resend APIs (fast timeouts).
  const checks: Record<string, DepCheck> = {
    env_stripe: { ok: Boolean((serverEnv.STRIPE_SECRET_KEY || '').trim()) },
    env_resend: { ok: Boolean((serverEnv.RESEND_API_KEY || '').trim()) },
    env_supabase_admin: { ok: Boolean((serverEnv.SUPABASE_SERVICE_ROLE_KEY || '').trim()) },
    supabase: await checkSupabase(),
  };

  if (deep) {
    const [stripe, resend] = await Promise.all([checkStripe(), checkResend()]);
    checks.stripe = stripe;
    checks.resend = resend;
  }

  const ok = Object.values(checks).every((c) => c.ok || c.skipped);

  return NextResponse.json(
    {
      ok,
      deep,
      requestId,
      ts: new Date().toISOString(),
      checks,
    },
    { status: ok ? 200 : 500, headers: withRequestId(undefined, requestId) },
  );
}
