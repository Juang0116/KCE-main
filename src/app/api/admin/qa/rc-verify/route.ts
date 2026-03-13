// src/app/api/admin/qa/rc-verify/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { serverEnv, SITE_URL, isProd } from '@/lib/env';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getStripe } from '@/lib/stripe.server';
import { signLinkToken } from '@/lib/linkTokens.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { fromTable } from '@/lib/supabaseTyped.server';

import type { Json, TablesInsert } from '@/types/supabase';

import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Check = {
  id: string;
  label: string;
  ok: boolean;
  detail?: string | undefined;
  meta?: Record<string, unknown> | undefined;
};

const QuerySchema = z.object({
  session_id: z.string().trim().min(8),
  heal_booking: z
    .preprocess((v) => String(v ?? '').trim(), z.enum(['0', '1']).optional())
    .optional(),
  heal_email: z
    .preprocess((v) => String(v ?? '').trim(), z.enum(['0', '1']).optional())
    .optional(),
  // alias
  heal: z.preprocess((v) => String(v ?? '').trim(), z.enum(['0', '1']).optional()).optional(),
});

function safeStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function upper(v: unknown): string {
  const s = safeStr(v);
  return s ? s.toUpperCase() : '';
}

function parseYMD(v: unknown): string | null {
  const s = safeStr(v);
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : s;
}

function metaToJson(meta: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (typeof v === 'string') {
      const s = v.trim();
      if (s) out[k] = s;
    }
  }
  return out;
}

function baseUrl() {
  const raw = String(SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  return (raw || 'http://localhost:3000').replace(/\/+$/, '');
}

async function fetchBookingBySessionId(sessionId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return { data: null as any, error: new Error('Supabase admin not configured') };
  const res = await admin
    .from('bookings')
    .select('id,status,total,currency,created_at,updated_at,stripe_session_id,customer_email,customer_name,deal_id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();
  return { data: res.data, error: res.error };
}

async function ensureBookingFromStripe(session: Stripe.Checkout.Session, requestId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin not configured');

  const stripe_session_id = safeStr(session.id);
  if (!stripe_session_id) throw new Error('Missing session.id');

  const meta = (session.metadata ?? {}) as Record<string, string | undefined>;
  const metaJson = metaToJson(meta);

  const deal_id = safeStr(meta.deal_id || meta.dealId) || null;
  const tour_id = safeStr(meta.tour_id) || null;
  const tour_slug = safeStr(meta.tour_slug || meta.slug) || null;
  const tour_title = safeStr(meta.tour_title || meta.title) || null;

  const date = parseYMD(meta.date || meta.tour_date) || new Date().toISOString().slice(0, 10);
  const persons = (() => {
    const raw = safeStr(meta.persons || meta.quantity || meta.people || meta.pax) || '1';
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  })();

  const currency = upper(session.currency) || 'EUR';
  const total = typeof session.amount_total === 'number' ? Math.trunc(session.amount_total) : null;

  const customer_email = safeStr(session.customer_details?.email ?? session.customer_email) || null;
  const customer_name = safeStr(session.customer_details?.name) || null;

  const extras: Json = {
    tour_slug,
    tour_title,
    payment_status: session.payment_status ?? null,
    payment_intent_id:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
    customer_id:
      typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? null),
    meta: metaJson,
  };

  const row: TablesInsert<'bookings'> = {
    tour_id,
    date,
    persons,
    status: 'paid',
    total,
    currency,
    origin_currency: currency,
    tour_price_minor: meta.tour_price_minor ? Number(meta.tour_price_minor) : null,
    payment_provider: 'stripe',
    stripe_session_id,
    customer_email,
    customer_name,
    extras,
    user_id: null,
    ...(deal_id ? { deal_id } : {}),
  };

  const up = await fromTable(admin, 'bookings')
    .upsert(row, { onConflict: 'stripe_session_id' })
    .select('id')
    .single();

  if (up.error) throw up.error;

  void logEvent(
    'qa.heal.booking_upserted',
    { request_id: requestId, stripe_session_id, booking_id: up.data?.id ?? null },
    { source: 'api', entityId: stripe_session_id, dedupeKey: `qa:heal:booking:${stripe_session_id}` },
  );

  return up.data?.id ?? null;
}

async function findEventByDedupeKey(dedupeKey: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const r = await admin
    .from('events')
    .select('id,type,created_at')
    .eq('dedupe_key', dedupeKey)
    .maybeSingle();
  return r.data ?? null;
}

async function findLatestEventByType(type: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const r = await admin
    .from('events')
    .select('id,type,created_at')
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return r.data ?? null;
}

async function findLatestIncidentByKind(kind: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const r = await fromTable(admin, 'ops_incidents')
    .select('id,kind,severity,status,created_at,updated_at')
    .eq('kind', kind)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return r.data ?? null;
}

async function findEmailEventForBooking(bookingId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const r = await admin
    .from('events')
    .select('id,type,created_at')
    .eq('type', 'email.booking_confirmation.sent')
    .filter('payload->>booking_id', 'eq', bookingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return r.data ?? null;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Invalid query', details: parsed.error.flatten() },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const sessionId = parsed.data.session_id;
  const wantsHealBooking = parsed.data.heal_booking === '1' || parsed.data.heal === '1';
  const wantsHealEmail = parsed.data.heal_email === '1';

  const checks: Check[] = [];
  const add = (c: Check) =>
    checks.push({
      id: c.id,
      label: c.label,
      ok: c.ok,
      ...(typeof c.detail === 'string' ? { detail: c.detail } : {}),
      ...(c.meta ? { meta: c.meta } : {}),
    });

  add({
    id: 'env.site_url',
    label: 'SITE_URL configured (https in production)',
    ok: !!baseUrl() && (!isProd || baseUrl().startsWith('https://')),
    detail: isProd && !baseUrl().startsWith('https://') ? 'Set NEXT_PUBLIC_SITE_URL to https in prod.' : undefined,
    meta: { siteUrl: baseUrl() },
  });

  add({
    id: 'env.stripe',
    label: 'Stripe configured',
    ok: !!serverEnv.STRIPE_SECRET_KEY,
    detail: !serverEnv.STRIPE_SECRET_KEY ? 'Missing STRIPE_SECRET_KEY' : undefined,
  });
  add({
    id: 'env.resend',
    label: 'Resend configured',
    ok: !!serverEnv.RESEND_API_KEY && !!serverEnv.EMAIL_FROM,
    detail: !serverEnv.RESEND_API_KEY || !serverEnv.EMAIL_FROM ? 'Missing RESEND_API_KEY and/or EMAIL_FROM' : undefined,
  });
  add({
    id: 'env.link_token',
    label: 'LINK_TOKEN_SECRET configured',
    ok: !!serverEnv.LINK_TOKEN_SECRET,
    detail: !serverEnv.LINK_TOKEN_SECRET ? 'Missing LINK_TOKEN_SECRET' : undefined,
  });

  // 1) Stripe session
  let session: Stripe.Checkout.Session | null = null;
  try {
    const stripe = getStripe();
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer_details'],
    });
    add({
      id: 'stripe.session',
      label: 'Stripe session retrieved',
      ok: true,
      meta: {
        livemode: !!session.livemode,
        payment_status: session.payment_status,
        currency: session.currency,
        amount_total: session.amount_total,
      },
    });
  } catch (e) {
    add({
      id: 'stripe.session',
      label: 'Stripe session retrieved',
      ok: false,
      detail: e instanceof Error ? e.message : 'Stripe retrieve failed',
    });
  }

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        session_id: sessionId,
        checks,
        hint:
          'If this is a TEST session, ensure STRIPE_SECRET_KEY is a test key (sk_test_...). If LIVE, use sk_live_... and the correct Stripe account.',
      },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  }

  add({
    id: 'stripe.paid',
    label: 'Payment status is paid',
    ok: session.payment_status === 'paid',
    detail:
      session.payment_status === 'paid'
        ? undefined
        : `payment_status=${String(session.payment_status || 'unknown')}`,
  });

  const cur = safeStr(session.currency) || '';
  add({
    id: 'stripe.currency_eur',
    label: 'Checkout currency is EUR (EU market)',
    ok: cur.toLowerCase() === 'eur',
    detail: cur ? `currency=${cur}` : 'currency missing',
  });

  // 2) Booking in Supabase
  let booking = await fetchBookingBySessionId(sessionId);
  add({
    id: 'supabase.booking_exists',
    label: 'Booking row exists (bookings.stripe_session_id)',
    ok: !!booking.data,
    detail: booking.data ? undefined : 'Missing booking — likely Stripe webhook not firing or failing.',
    meta: booking.data
      ? { booking_id: booking.data.id, status: booking.data.status, currency: booking.data.currency }
      : undefined,
  });

  if (!booking.data && wantsHealBooking) {
    try {
      const id = await ensureBookingFromStripe(session, requestId);
      booking = await fetchBookingBySessionId(sessionId);
      add({
        id: 'heal.booking',
        label: 'Self-heal: booking upserted from Stripe session',
        ok: !!id && !!booking.data,
        detail: !id ? 'Could not upsert booking (see logs)' : undefined,
        meta: id ? { booking_id: id } : undefined,
      });
    } catch (e) {
      add({
        id: 'heal.booking',
        label: 'Self-heal: booking upserted from Stripe session',
        ok: false,
        detail: e instanceof Error ? e.message : 'heal booking failed',
      });
    }
  }

  // 3) Event trail
  const evCreated = await findEventByDedupeKey(`checkout:session_created:${sessionId}`);
  add({
    id: 'events.checkout_session_created',
    label: 'Event: checkout.session_created logged',
    ok: !!evCreated,
    detail: evCreated ? undefined : 'Missing event (informational).',
    meta: evCreated ?? undefined,
  });

  const evPaid = await findEventByDedupeKey(`checkout:paid:${sessionId}`);
  add({
    id: 'events.checkout_paid',
    label: 'Event: checkout.paid logged (webhook executed)',
    ok: !!evPaid,
    detail:
      evPaid
        ? undefined
        : 'Missing checkout.paid — strongest signal your Stripe webhook is not reaching /api/webhooks/stripe or is failing before logging.',
    meta: evPaid ?? undefined,
  });

  // Webhook received (global signal)
  const evWebhook = await findLatestEventByType('stripe.webhook_received').catch(() => null);
  add({
    id: 'events.stripe_webhook_received',
    label: 'Event: stripe.webhook_received seen recently (informational)',
    ok: !!evWebhook,
    detail: evWebhook ? undefined : 'No webhook events logged yet. Confirm Stripe webhook config.',
    meta: evWebhook ?? undefined,
  });

  // Ops incidents (informational)
  const lastStripeErr = await findLatestIncidentByKind('stripe_webhook_error').catch(() => null);
  add({
    id: 'ops.stripe_webhook_error',
    label: 'Ops: stripe_webhook_error (informational)',
    ok: true,
    detail: lastStripeErr
      ? `Last: ${String(lastStripeErr.created_at)} (status=${String(lastStripeErr.status || 'n/a')})`
      : '—',
    meta: lastStripeErr ?? undefined,
  });

  const bookingId = booking.data?.id ? String(booking.data.id) : '';
  const evEmail = bookingId ? await findEmailEventForBooking(bookingId) : null;
  add({
    id: 'events.email_sent',
    label: 'Event: email.booking_confirmation.sent logged',
    ok: !!evEmail,
    detail:
      evEmail
        ? undefined
        : bookingId
          ? 'Email not logged yet. Check RESEND_API_KEY/EMAIL_FROM and ops circuit breaker.'
          : 'Booking missing — can’t validate email event.',
    meta: evEmail ?? (bookingId ? { booking_id: bookingId } : undefined),
  });

  // Optional self-heal: re-send booking confirmation email (+ PDF)
  if (wantsHealEmail && session.payment_status === 'paid') {
    try {
      const linkSecret = safeStr(serverEnv.LINK_TOKEN_SECRET);
      const t = linkSecret
        ? signLinkToken({ sessionId, secret: linkSecret, ttlSeconds: 60 * 30 })
        : '';

      const internal = safeStr(serverEnv.INTERNAL_API_KEY);
      const res = await fetch(`${baseUrl()}/api/email/booking-confirmation`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          ...(internal ? { 'x-internal-key': internal } : {}),
        },
        body: JSON.stringify({ session_id: sessionId, ...(t ? { t } : {}) }),
        cache: 'no-store',
      });

      const j = await res.json().catch(() => null);

      add({
        id: 'heal.email',
        label: 'Self-heal: re-send booking confirmation email (PDF)',
        ok: res.ok,
        detail: res.ok ? 'Email request accepted. Check inbox/spam.' : String((j as any)?.error || res.status),
      });
    } catch (e) {
      add({
        id: 'heal.email',
        label: 'Self-heal: re-send booking confirmation email (PDF)',
        ok: false,
        detail: e instanceof Error ? e.message : 'heal email failed',
      });
    }
  }

  // 4) Signed links (booking + invoice)
  const linkSecret = safeStr(serverEnv.LINK_TOKEN_SECRET);
  const token = linkSecret
    ? signLinkToken({ sessionId, secret: linkSecret, ttlSeconds: 60 * 60 })
    : '';

  add({
    id: 'links.token',
    label: 'Signed link token generation',
    ok: !!token,
    detail: !token ? 'Missing LINK_TOKEN_SECRET' : undefined,
    meta: token
      ? {
          booking_url: `${baseUrl()}/booking/${encodeURIComponent(sessionId)}?t=${encodeURIComponent(token)}`,
          invoice_url: `${baseUrl()}/api/invoice/${encodeURIComponent(sessionId)}?t=${encodeURIComponent(token)}&download=1`,
        }
      : undefined,
  });

  const ok = checks.every((c) => c.ok || c.id === 'events.checkout_session_created');

  return NextResponse.json(
    {
      ok,
      requestId,
      session_id: sessionId,
      booking_id: bookingId || null,
      checks,
      next_actions: [
        !evPaid
          ? 'If Stripe shows the session is paid but checkout.paid is missing: fix Stripe webhook endpoint + STRIPE_WEBHOOK_SECRET and confirm events are reaching /api/webhooks/stripe.'
          : null,
        !booking.data
          ? 'If booking row is missing: run rc-verify with heal=1 (safe) or re-send the Stripe event from Stripe dashboard.'
          : null,
      ].filter(Boolean),
    },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
