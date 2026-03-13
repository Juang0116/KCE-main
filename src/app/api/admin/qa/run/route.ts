// src/app/api/admin/qa/run/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getAllowedOrigins } from '@/lib/cors';
import { publicEnv, serverEnv } from '@/lib/env';
import { logEvent } from '@/lib/events.server';
import { getRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  /**
   * mode=prod enables stricter checks for Vercel/production.
   */
  mode: z
    .string()
    .optional()
    .transform((v) => (v === 'prod' || v === 'production' ? 'prod' : 'dev')),

  /**
   * Optional: deep=1 enables a lightweight Stripe network call.
   * Default is shallow checks (no Stripe network).
   */
  deep: z
    .string()
    .optional()
    .transform((v) => v === '1' || v === 'true'),
});

type Check = {
  id: string;
  label: string;
  ok: boolean;
  ms: number;
  detail?: string;
};

function addCheck(
  checks: Check[],
  c: { id: string; label: string; ok: boolean; ms: number; detail?: string | null | undefined },
) {
  // exactOptionalPropertyTypes: nunca empujes detail: undefined
  const { detail, ...rest } = c;
  checks.push(detail ? { ...rest, detail } : rest);
}

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; value: T }> {
  const t0 = Date.now();
  const value = await fn();
  return { ms: Date.now() - t0, value };
}

function present(v: unknown): boolean {
  return Boolean(v) && String(v).trim().length > 0;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const reqId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  const deep = parsed.success ? parsed.data.deep : false;
  const mode = parsed.success ? (parsed.data.mode ?? 'dev') : 'dev';
  const prod = mode === 'prod';

  const checks: Check[] = [];

  // 1) ENV presence (no secrets returned)
  {
    const t0 = Date.now();
    const ok =
      present(publicEnv.NEXT_PUBLIC_SUPABASE_URL) &&
      present(publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      present(serverEnv.SUPABASE_SERVICE_ROLE_KEY);

    addCheck(checks, {
      id: 'env.supabase',
      label: 'ENV: Supabase URL/Anon/Service Role present',
      ok,
      ms: Date.now() - t0,
      detail: ok
        ? undefined
        : 'Missing one of NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY',
    });
  }

  // 1.1) CORS allowlist (informational)
  {
    const t0 = Date.now();
    const origins = getAllowedOrigins();
    addCheck(checks, {
      id: 'cors.allowlist',
      label: 'CORS: allowed origins resolved',
      ok: origins.length > 0,
      ms: Date.now() - t0,
      detail: origins.join(', '),
    });
  }

  {
    const t0 = Date.now();
    const ok = present(serverEnv.STRIPE_SECRET_KEY);
    addCheck(checks, {
      id: 'env.stripe',
      label: 'ENV: Stripe secret present',
      ok,
      ms: Date.now() - t0,
      detail: ok ? undefined : 'Missing STRIPE_SECRET_KEY',
    });
  }

  {
    const t0 = Date.now();
    const ok = present(serverEnv.RESEND_API_KEY) && present(serverEnv.EMAIL_FROM);
    addCheck(checks, {
      id: 'env.resend',
      label: 'ENV: Resend + EMAIL_FROM present',
      ok,
      ms: Date.now() - t0,
      detail: ok ? undefined : 'Missing RESEND_API_KEY and/or EMAIL_FROM',
    });
  }

  {
    const t0 = Date.now();
    const siteUrl = String(publicEnv.NEXT_PUBLIC_SITE_URL ?? '').trim();
    const ok =
      present(siteUrl) &&
      (!prod || (siteUrl.startsWith('https://') && !siteUrl.includes('localhost')));
    addCheck(checks, {
      id: 'env.site_url',
      label: prod
        ? 'ENV: NEXT_PUBLIC_SITE_URL present and https (prod)'
        : 'ENV: NEXT_PUBLIC_SITE_URL present',
      ok,
      ms: Date.now() - t0,
      detail: ok
        ? undefined
        : prod
          ? 'Set NEXT_PUBLIC_SITE_URL to an https URL (not localhost)'
          : 'Missing NEXT_PUBLIC_SITE_URL',
    });
  }

  {
    const t0 = Date.now();
    const ok = !prod || present(serverEnv.STRIPE_WEBHOOK_SECRET);
    addCheck(checks, {
      id: 'env.stripe_webhook',
      label: prod
        ? 'ENV: STRIPE_WEBHOOK_SECRET present (prod)'
        : 'ENV: STRIPE_WEBHOOK_SECRET optional (dev)',
      ok,
      ms: Date.now() - t0,
      detail: ok ? undefined : 'Missing STRIPE_WEBHOOK_SECRET',
    });
  }

  // ADMIN basic: tu env.ts no tipa estas variables => usa process.env para evitar TS2339
  {
    const t0 = Date.now();
    const adminUser = process.env.ADMIN_BASIC_USER;
    const adminPass = process.env.ADMIN_BASIC_PASS;

    const ok = !prod || (present(adminUser) && present(adminPass));
    addCheck(checks, {
      id: 'env.admin_basic',
      label: prod
        ? 'ENV: ADMIN_BASIC_USER/PASS present (prod)'
        : 'ENV: ADMIN_BASIC_USER/PASS optional (dev)',
      ok,
      ms: Date.now() - t0,
      detail: ok ? undefined : 'Missing ADMIN_BASIC_USER and/or ADMIN_BASIC_PASS',
    });
  }

  // Prod strict CORS sanity (separado, id distinto)
  {
    const t0 = Date.now();
    const allowed = getAllowedOrigins();
    const siteUrl = String(publicEnv.NEXT_PUBLIC_SITE_URL ?? '').trim();

    let ok = allowed.length > 0;
    if (prod && siteUrl) {
      try {
        const origin = new URL(siteUrl).origin;
        ok = ok && allowed.includes(origin);
      } catch {
        ok = false;
      }
      ok = ok && !allowed.some((o) => o.includes('localhost'));
    }

    addCheck(checks, {
      id: 'cors.allowlist.prod',
      label: prod
        ? 'CORS: allowlist includes site origin + avoids localhost (prod)'
        : 'CORS: prod checks skipped (dev)',
      ok: prod ? ok : true,
      ms: Date.now() - t0,
      detail: prod
        ? ok
          ? undefined
          : 'Configure CORS_ALLOW_ORIGINS to include your site origin and avoid localhost'
        : undefined,
    });
  }

  // 2) Supabase Admin connectivity (read)
  try {
    const { ms, value } = await timed(async () =>
      admin.from('events').select('id', { count: 'exact', head: true }),
    );
    addCheck(checks, {
      id: 'supabase.admin.read',
      label: 'Supabase Admin: can read events (head count)',
      ok: !(value as any).error,
      ms,
      detail: (value as any).error?.message,
    });
  } catch (e) {
    addCheck(checks, {
      id: 'supabase.admin.read',
      label: 'Supabase Admin: can read events (head count)',
      ok: false,
      ms: 0,
      detail: e instanceof Error ? e.message : 'Unknown error',
    });
  }

  // 3) Supabase Admin write (idempotent via dedupe_key)
  try {
    const { ms, value } = await timed(async () =>
      admin
        .from('events')
        .insert({
          type: 'qa.ping',
          payload: { request_id: reqId },
          dedupe_key: `qa:ping:${reqId}`,
          source: 'qa',
        } as any)
        .select('id')
        .maybeSingle(),
    );

    addCheck(checks, {
      id: 'supabase.admin.write',
      label: 'Supabase Admin: can insert events (qa.ping deduped)',
      ok: !(value as any).error,
      ms,
      detail: (value as any).error?.message,
    });
  } catch (e) {
    addCheck(checks, {
      id: 'supabase.admin.write',
      label: 'Supabase Admin: can insert events (qa.ping deduped)',
      ok: false,
      ms: 0,
      detail: e instanceof Error ? e.message : 'Unknown error',
    });
  }

  {
    const t0 = Date.now();
    const ok = !prod || present(serverEnv.LINK_TOKEN_SECRET);
    addCheck(checks, {
      id: 'env.link_token',
      label: prod
        ? 'ENV: LINK_TOKEN_SECRET present (prod)'
        : 'ENV: LINK_TOKEN_SECRET optional (dev)',
      ok,
      ms: Date.now() - t0,
      detail: ok
        ? undefined
        : 'Missing LINK_TOKEN_SECRET (required to protect booking/invoice links in production)',
    });
  }

  // 4) Basic data presence (tours table reachable)
  try {
    const { ms, value } = await timed(async () =>
      admin.from('tours').select('id', { count: 'exact', head: true }),
    );
    addCheck(checks, {
      id: 'supabase.tours',
      label: 'Supabase: tours table reachable (head count)',
      ok: !(value as any).error,
      ms,
      detail: (value as any).error?.message,
    });
  } catch (e) {
    addCheck(checks, {
      id: 'supabase.tours',
      label: 'Supabase: tours table reachable (head count)',
      ok: false,
      ms: 0,
      detail: e instanceof Error ? e.message : 'Unknown error',
    });
  }

  // 4b) Core tables presence (head count)
  const coreTables = [
    {
      id: 'supabase.bookings',
      table: 'bookings',
      label: 'Supabase: bookings table reachable (head count)',
    },
    {
      id: 'supabase.reviews',
      table: 'reviews',
      label: 'Supabase: reviews table reachable (head count)',
    },
    {
      id: 'supabase.event_locks',
      table: 'event_locks',
      label: 'Supabase: event_locks table reachable (head count)',
    },
    {
      id: 'supabase.rate_limits',
      table: 'rate_limits',
      label: 'Supabase: rate_limits table reachable (head count)',
    },
    { id: 'supabase.leads', table: 'leads', label: 'Supabase: leads table reachable (head count)' },
    {
      id: 'supabase.customers',
      table: 'customers',
      label: 'Supabase: customers table reachable (head count)',
    },
    {
      id: 'supabase.conversations',
      table: 'conversations',
      label: 'Supabase: conversations table reachable (head count)',
    },
    {
      id: 'supabase.messages',
      table: 'messages',
      label: 'Supabase: messages table reachable (head count)',
    },
    {
      id: 'supabase.tickets',
      table: 'tickets',
      label: 'Supabase: tickets table reachable (head count)',
    },
    { id: 'supabase.posts', table: 'posts', label: 'Supabase: posts table reachable (head count)' },
    {
      id: 'supabase.videos',
      table: 'videos',
      label: 'Supabase: videos table reachable (head count)',
    },
    {
      id: 'supabase.segments',
      table: 'segments',
      label: 'Supabase: segments table reachable (head count)',
    },
  ] as const;

  for (const t of coreTables) {
    try {
      const { ms, value } = await timed(async () => {
        // event_locks ha tenido esquemas antiguos (sin `id`, sin `scope`, etc).
        // Para máxima compatibilidad, probamos columnas comunes y caemos a `*`.
        if (t.table === 'event_locks') {
          let r: any = await admin.from(t.table as any).select('key', { count: 'exact', head: true });
          if (r?.error) r = await admin.from(t.table as any).select('lock_key', { count: 'exact', head: true });
          if (r?.error) r = await admin.from(t.table as any).select('id', { count: 'exact', head: true });
          if (r?.error) r = await admin.from(t.table as any).select('*', { count: 'exact', head: true });
          return r;
        }
        return admin.from(t.table as any).select('id', { count: 'exact', head: true });
      });
      addCheck(checks, {
        id: t.id,
        label: t.label,
        ok: !(value as any).error,
        ms,
        // A veces PostgREST devuelve un error sin .message (o con string vacío)
        detail:
          (value as any).error?.message ||
          ((value as any).error ? JSON.stringify((value as any).error) : undefined),
      });
    } catch (e) {
      addCheck(checks, {
        id: t.id,
        label: t.label,
        ok: false,
        ms: 0,
        detail: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  }

  // 5) Storage buckets check (expects review_avatars)
  try {
    const { ms, value } = await timed(async () => admin.storage.listBuckets());
    const ok = !(value as any).error;

    let detail: string | undefined = (value as any).error?.message;
    if (ok) {
      const names = ((value as any).data ?? []).map((b: any) => b.name);
      if (!names.includes('review_avatars')) detail = 'Missing bucket: review_avatars';
      else detail = undefined;
    }

    addCheck(checks, {
      id: 'supabase.storage',
      label: 'Supabase Storage: list buckets (review_avatars expected)',
      ok,
      ms,
      detail,
    });
  } catch (e) {
    addCheck(checks, {
      id: 'supabase.storage',
      label: 'Supabase Storage: list buckets (review_avatars expected)',
      ok: false,
      ms: 0,
      detail: e instanceof Error ? e.message : 'Unknown error',
    });
  }

  // 6) Stripe sanity (no network call by default)
  {
    const { ms, value } = await timed(async () => {
      const key = serverEnv.STRIPE_SECRET_KEY || '';
      const looksOk = key.startsWith('sk_') && key.length > 20;
      if (!looksOk)
        return {
          ok: false,
          detail: 'STRIPE_SECRET_KEY does not look like a Stripe secret (sk_...)',
        };

      if (!deep) return { ok: true };

      const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });
      try {
        await stripe.accounts.retrieve();
        return { ok: true };
      } catch (e) {
        return { ok: false, detail: e instanceof Error ? e.message : 'Stripe error' };
      }
    });

    addCheck(checks, {
      id: 'stripe.check',
      label: deep
        ? 'Stripe: credentials + network check (accounts.retrieve)'
        : 'Stripe: credentials format check (no network)',
      ok: (value as any).ok,
      ms,
      detail: (value as any).detail,
    });
  }

  const ok = checks.every((c) => c.ok);

  // Best-effort audit log
  void logEvent(
    'admin.qa_run',
    {
      request_id: reqId,
      ok,
      deep,
      checks: checks.map((c) => ({ id: c.id, ok: c.ok, ms: c.ms })),
    },
    { source: 'qa', dedupeKey: `qa:run:${reqId}` },
  );

  return NextResponse.json(
    {
      ok,
      deep,
      mode,
      requestId: reqId,
      checks,
      summary: {
        passed: checks.filter((c) => c.ok).length,
        failed: checks.filter((c) => !c.ok).length,
      },
    },
    {
      headers: {
        'X-Request-ID': reqId,
        'Cache-Control': 'no-store',
      },
    },
  );
}
