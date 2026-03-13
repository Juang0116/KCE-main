// src/app/api/admin/system/status/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope, getAdminActor } from '@/lib/adminAuth';
import { serverEnv, publicEnv, SITE_URL, boolEnv } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CheckOk = { ok: true; detail: string; meta?: Record<string, any> };
type CheckBad = { ok: false; detail: string; meta?: Record<string, any> };
type Check = CheckOk | CheckBad;

function ok(detail: string, meta?: Record<string, any>): CheckOk {
  return meta ? { ok: true, detail, meta } : { ok: true, detail };
}
function bad(detail: string, meta?: Record<string, any>): CheckBad {
  return meta ? { ok: false, detail, meta } : { ok: false, detail };
}

function redact(v: string | undefined) {
  const s = String(v || '').trim();
  if (!s) return '';
  if (s.length <= 8) return '***';
  return `${s.slice(0, 3)}***${s.slice(-3)}`;
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let t: any;
  const timeout = new Promise<T>((_resolve, reject) => {
    t = setTimeout(() => reject(new Error(`Timeout (${ms}ms): ${label}`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(t);
  }
}

function envStr(name: string): string {
  return String(process.env[name] || '').trim();
}

type PgErr = { message: string } | null;
type PgRes<T> = { data: T | null; error: PgErr; count?: number | null };

type EventRow = {
  created_at: string;
  type: string;
  source?: string | null;
  payload?: any;
};

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const actor = await getAdminActor(req);
  const deep = req.nextUrl.searchParams.get('deep') === '1';
  const t0 = Date.now();

  const signedSecret = envStr('SIGNED_ACTIONS_SECRET');
  const rawSignedMode = envStr('SIGNED_ACTIONS_MODE').toLowerCase();
  const signedMode: 'off' | 'soft' | 'required' | '(auto)' =
    rawSignedMode === 'off' || rawSignedMode === 'soft' || rawSignedMode === 'required'
      ? (rawSignedMode as any)
      : signedSecret
        ? (process.env.NODE_ENV === 'production' ? 'required' : 'soft')
        : '(auto)';

  const envCheck: Record<string, any> = {
    nodeEnv: serverEnv.NODE_ENV || process.env.NODE_ENV || 'development',
    siteUrl: SITE_URL,
    signedActions: {
      mode: signedMode,
      secret: redact(signedSecret),
    },
    rbacRequired: boolEnv(process.env.RBAC_REQUIRED, false),
    turnstile: {
      enforce: boolEnv((serverEnv as any).TURNSTILE_ENFORCE, false),
      siteKey: redact(publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
      secretKey: redact((serverEnv as any).TURNSTILE_SECRET_KEY),
    },
    supabase: {
      url: publicEnv.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
      anonKey: redact(publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      serviceRole: redact((serverEnv as any).SUPABASE_SERVICE_ROLE_KEY || envStr('SUPABASE_SERVICE_ROLE_KEY')),
    },
    stripe: {
      publishable: redact(publicEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      secret: redact((serverEnv as any).STRIPE_SECRET_KEY || envStr('STRIPE_SECRET_KEY')),
      webhook: redact((serverEnv as any).STRIPE_WEBHOOK_SECRET || envStr('STRIPE_WEBHOOK_SECRET')),
      mock: boolEnv((serverEnv as any).STRIPE_MOCK, false),
    },
    email: {
      resend: redact((serverEnv as any).RESEND_API_KEY || envStr('RESEND_API_KEY')),
      from: (serverEnv as any).EMAIL_FROM || envStr('EMAIL_FROM') || '',
      replyTo: (serverEnv as any).EMAIL_REPLY_TO || envStr('EMAIL_REPLY_TO') || '',
    },
    ai: {
      primary: (serverEnv as any).AI_PRIMARY || envStr('AI_PRIMARY') || '',
      openai: redact((serverEnv as any).OPENAI_API_KEY || envStr('OPENAI_API_KEY')),
      gemini: redact((serverEnv as any).GEMINI_API_KEY || envStr('GEMINI_API_KEY')),
    },
    cron: {
      cronSecret: redact((serverEnv as any).CRON_SECRET || envStr('CRON_SECRET') || envStr('CRON_API_TOKEN')),
      autopilotApiToken: redact(envStr('AUTOPILOT_API_TOKEN')),
      internalHmac: redact(envStr('INTERNAL_HMAC_SECRET')),
    },
  };

  const requiredEnv: Array<[string, boolean]> = [
    ['NEXT_PUBLIC_SUPABASE_URL', Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_URL)],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY)],
    ['SUPABASE_SERVICE_ROLE_KEY', Boolean((serverEnv as any).SUPABASE_SERVICE_ROLE_KEY || envStr('SUPABASE_SERVICE_ROLE_KEY'))],
    ['STRIPE_SECRET_KEY', Boolean((serverEnv as any).STRIPE_SECRET_KEY || envStr('STRIPE_SECRET_KEY'))],
    ['STRIPE_WEBHOOK_SECRET', Boolean((serverEnv as any).STRIPE_WEBHOOK_SECRET || envStr('STRIPE_WEBHOOK_SECRET'))],
    ['RESEND_API_KEY', Boolean((serverEnv as any).RESEND_API_KEY || envStr('RESEND_API_KEY'))],
    ['LINK_TOKEN_SECRET', Boolean((serverEnv as any).LINK_TOKEN_SECRET || envStr('LINK_TOKEN_SECRET'))],
  ];
  const missingEnv = requiredEnv.filter(([, present]) => !present).map(([k]) => k);

  const checks: Record<string, Check> = {
    env: missingEnv.length ? bad(`Faltan env vars: ${missingEnv.join(', ')}`) : ok('Env mínimo OK'),
  };

  try {
    const admin = getSupabaseAdmin() as any;
    if (!admin) throw new Error('Supabase admin not configured');

    const dbPing = (await withTimeout(
      admin.from('events').select('id', { head: true, count: 'exact' }).limit(1),
      2500,
      'supabase.events.head',
    )) as PgRes<null>;

    if (dbPing.error) {
      checks.db = bad(`Supabase error: ${dbPing.error.message}`);
    } else {
      checks.db = ok('Supabase OK', { eventsCount: dbPing.count ?? null });
    }

    const queued = (await withTimeout(
      admin.from('crm_outbound_messages').select('id', { head: true, count: 'exact' }).eq('status', 'queued'),
      2500,
      'supabase.outbound.queued.count',
    )) as PgRes<null>;

    const lastPaid = (await withTimeout(
      admin
        .from('events')
        .select('created_at,type,source,payload')
        .eq('type', 'checkout.paid')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      2500,
      'supabase.events.checkout.paid.latest',
    )) as PgRes<EventRow>;

    const gates: Record<string, any> = {
      outboundQueued: queued.error ? null : queued.count ?? 0,
      lastCheckoutPaidAt: lastPaid.error ? null : lastPaid.data?.created_at ?? null,
      lastCheckoutPaidCurrency: lastPaid.error ? null : (lastPaid.data as any)?.payload?.currency ?? null,
      lastCheckoutPaidAmountMinor: lastPaid.error ? null : (lastPaid.data as any)?.payload?.amount_total_minor ?? null,
    };

    checks.gates = ok('Gates calculados', gates);
  } catch (e: any) {
    checks.db = bad(String(e?.message || 'DB check failed'));
  }

  if (deep) {
    // Stripe
    try {
      const key = String((serverEnv as any).STRIPE_SECRET_KEY || envStr('STRIPE_SECRET_KEY')).trim();
      if (!key) {
        checks.stripe = bad('STRIPE_SECRET_KEY no configurada');
      } else {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(key, { apiVersion: '2024-06-20' } as any);
        const bal = await withTimeout(stripe.balance.retrieve(), 2500, 'stripe.balance.retrieve');
        checks.stripe = ok('Stripe OK', { available: (bal as any)?.available?.[0]?.amount ?? null });
      }
    } catch (e: any) {
      checks.stripe = bad(`Stripe check falló: ${String(e?.message || e)}`);
    }

    // Resend (best-effort)
    try {
      const key = String((serverEnv as any).RESEND_API_KEY || envStr('RESEND_API_KEY')).trim();
      if (!key) {
        checks.resend = bad('RESEND_API_KEY no configurada');
      } else {
        const { Resend } = await import('resend');
        const resend = new Resend(key);

        // ✅ FIX: tipar/castear el resultado para poder leer `.data`
        const domains = (await withTimeout(
          (resend as any).domains.list(),
          2500,
          'resend.domains.list',
        )) as { data?: unknown };

        const list = Array.isArray(domains?.data) ? (domains.data as any[]) : null;
        const total = list ? list.length : null;

        checks.resend = ok('Resend OK', { domains: total });
      }
    } catch (e: any) {
      checks.resend = bad(`Resend check falló: ${String(e?.message || e)}`);
    }
  }

  const ms = Date.now() - t0;

  void logEvent(
    'admin.system.status',
    {
      requestId,
      actor,
      deep,
      ok: Object.values(checks).every((c) => c.ok),
      ms,
      nodeEnv: serverEnv.NODE_ENV || process.env.NODE_ENV,
    },
    { source: 'admin' },
  );

  return NextResponse.json(
    { ok: Object.values(checks).every((c) => c.ok), deep, actor, ms, env: envCheck, checks, requestId },
    { headers: withRequestId({ 'cache-control': 'no-store' } as any, requestId) },
  );
}
