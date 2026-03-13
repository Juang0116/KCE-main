// src/app/api/checkout/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { z } from 'zod';

import { getTourBySlug } from '@/features/tours/catalog.server';
import { jsonError, contentLengthBytes } from '@/lib/apiErrors';
import { getRequestChannel } from '@/lib/requestGuards.server';
import { verifyTurnstile } from '@/lib/turnstile.server';
import { logEvent } from '@/lib/events.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { enforceCostBudget } from '@/lib/costBudget.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getStripe } from '@/lib/stripe.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import type { TablesUpdate } from '@/types/supabase';
import { fromTable } from '@/lib/supabaseTyped.server';
import { readUtmFromCookies, utmCompactKey } from '@/lib/utm.server';
import { readLandingFromCookies, readMultiTouchAttributionFromCookies } from '@/lib/ctaAttribution.server';
import { logOpsIncident } from '@/lib/opsIncidents.server';
import { assertOpsNotPaused } from '@/lib/opsCircuitBreaker.server';
import { getLocalePrefix, getRequestOrigin } from '@/lib/requestUrl.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function envFlag(name: string, defaultOn = true): boolean {
  const raw = String(process.env[name] ?? '').trim();
  if (!raw) return defaultOn;
  if (raw === '1') return true;
  if (raw === '0') return false;
  return ['true', 'yes', 'on', 'enabled'].includes(raw.toLowerCase());
}

function envString(name: string, fallback: string): string {
  const raw = String(process.env[name] ?? '').trim();
  return raw ? raw : fallback;
}

function clampInt(n: unknown, min: number, max: number, fallback: number) {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

const CheckoutSchema = z
  .object({
    slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/i),
    date: z.string().trim().min(8).max(32),
    guests: z.number().int().min(1).max(20).default(1),
    dealId: z.string().trim().max(64).optional().default(''),
    email: z.string().trim().email().optional(),
  })
  .transform((v) => ({ ...v, date: v.date }));

const RawBodySchema = z
  .object({
    turnstileToken: z.string().trim().min(1).optional().nullable(),
    slug: z.string().trim().min(1).optional(),
    tour: z.object({ slug: z.string().trim().min(1).optional() }).optional(),
    date: z.string().trim().optional(),
    guests: z.union([z.number(), z.string()]).optional(),
    quantity: z.union([z.number(), z.string()]).optional(),
    dealId: z.string().trim().optional(),
    email: z.string().trim().optional(),
  })
  .passthrough();


function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getTourNumber(tour: unknown, key: string): number | null {
  const v = (tour as Record<string, unknown> | null)?.[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function getTourString(tour: unknown, key: string): string | null {
  const v = (tour as Record<string, unknown> | null)?.[key];
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s : null;
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  // Ops circuit breaker: temporary pause to prevent cascading failures.
  const pause = await assertOpsNotPaused(req, 'checkout');
  if (!pause.ok) {
    const retry = 60;
    return NextResponse.json(
      {
        error: 'Checkout temporarily paused. Please try again shortly.',
        requestId,
        pausedUntil: pause.pausedUntil ?? null,
        reason: pause.reason ?? null,
      },
      { status: 503, headers: { 'retry-after': String(retry) } },
    );
  }

  const channel = getRequestChannel(req);

  const rl = await checkRateLimit(req, {
    action: 'checkout.create.' + channel,
    limit: 20,
    windowSeconds: 60 * 60,
    identity: 'ip+vid',
  });
  if (!rl.allowed) {
    return jsonError(req, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many requests.',
      requestId,
    });
  }

  const budget = await enforceCostBudget(req, 'checkout');
  if (!budget.allowed) {
    // ApiErrorCode no incluye BUDGET_EXCEEDED -> usamos RATE_LIMITED (429) pero con mensaje claro.
    return jsonError(req, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Daily budget exceeded. Please try again later.',
      requestId,
      extra: {
        budget: 'checkout',
      },
    });
  }

  const clen = contentLengthBytes(req);
  if (clen && clen > 10_000) {
    return jsonError(req, {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Payload too large.',
      requestId,
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const raw = RawBodySchema.safeParse(body);
    const b = raw.success ? raw.data : {};

    const ts = await verifyTurnstile(req, b.turnstileToken ?? null);
    if (!ts.ok) {
      // ApiErrorCode no incluye TURNSTILE_FAILED -> usamos FORBIDDEN (anti-abuse).
      return jsonError(req, {
        status: 400,
        code: 'FORBIDDEN',
        message: 'Verification failed.',
        requestId,
        extra: {
          reason: 'turnstile_failed',
          errorCodes: ts.errorCodes ?? [],
        },
      });
    }

    const rawSlug = (typeof b.slug === 'string' && b.slug) || (typeof b.tour?.slug === 'string' && b.tour.slug) || '';

    const parsed = CheckoutSchema.safeParse({
      slug: String(rawSlug || ''),
      date: String(typeof b.date === 'string' ? b.date : ''),
      guests: clampInt((b.guests ?? b.quantity ?? 1) as unknown, 1, 20, 1),
      dealId: typeof b.dealId === 'string' ? b.dealId : '',
      email: typeof b.email === 'string' ? b.email : undefined,
    });;

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const { slug, date, guests, dealId, email } = parsed.data;

    if (!isIsoDate(date)) {
      return NextResponse.json(
        { error: 'Invalid date (expected YYYY-MM-DD)', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const tour = await getTourBySlug(slug);
    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found', errorCode: 'NOT_FOUND', requestId },
        { status: 404, headers: withRequestId(undefined, requestId) },
      );
    }

    const basePrice = getTourNumber(tour, 'base_price');
    const price = basePrice ?? (getTourNumber(tour, 'price') ?? 0);

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: 'Tour price not configured', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const stripe = getStripe();

    const origin = getRequestOrigin(req);
    const localePrefix = getLocalePrefix(req);

    const successUrl = `${origin}${localePrefix}/checkout/success?session_id={CHECKOUT_SESSION_ID}&tour=${encodeURIComponent(
      (getTourString(tour, 'slug') || slug),
    )}&date=${encodeURIComponent(date)}&q=${encodeURIComponent(String(guests))}`;

    const cancelUrl = `${origin}${localePrefix}/checkout/cancel?tour=${encodeURIComponent(
      (getTourString(tour, 'slug') || slug),
    )}&date=${encodeURIComponent(date)}&q=${encodeURIComponent(String(guests))}&reason=user_canceled`;

    const utm = readUtmFromCookies(req);
    const utm_key = utmCompactKey(utm);

    // CTA + landing attribution (best-effort, non-PII)
    const mt = readMultiTouchAttributionFromCookies(req);
    const landing = readLandingFromCookies(req);

    void logEvent(
      'checkout.started',
      {
        request_id: requestId,
        tour_id: getTourString(tour, 'id'),
        tour_slug: (getTourString(tour, 'slug') || slug),
        date,
        persons: guests,
        vid: utm.vid,
        utm_key,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,

        landing_path: landing.landing_path,
        landing_at: landing.landing_at,
        first_cta: mt.first.cta,
        first_cta_page: mt.first.cta_page,
        first_cta_at: mt.first.cta_at,
        last_cta: mt.last.cta,
        last_cta_page: mt.last.cta_page,
        last_cta_at: mt.last.cta_at,
      },
      { source: 'api' },
    );

    const description = getTourString(tour, 'summary') || getTourString(tour, 'short') || undefined;
    const unitAmount = Math.round(price);

    // Stripe EU defaults
    // NOTE: `automatic_payment_methods` is a PaymentIntent parameter, NOT a Checkout Session parameter.
    // For Checkout Sessions, "dynamic payment methods" are enabled by omitting `payment_method_types`
    // (managed in Stripe Dashboard) or by providing a `payment_method_configuration` ID.
    // - Dynamic payment methods (Apple Pay / Google Pay / local methods) can improve EU conversion.
    // - Keep safe toggles via env for controlled rollouts.
    const enableDynamicPm = envFlag(
      'STRIPE_DYNAMIC_PAYMENT_METHODS',
      envFlag('STRIPE_AUTOMATIC_PAYMENT_METHODS', true), // legacy alias
    );
    const paymentMethodConfiguration = envString('STRIPE_PAYMENT_METHOD_CONFIGURATION', '').trim();
    const enableTaxId = envFlag('STRIPE_TAX_ID_COLLECTION', false);
    const billingAddress = envString('STRIPE_BILLING_ADDRESS_COLLECTION', 'auto');

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      // If dynamic payment methods are enabled, omit payment_method_types so Stripe can decide based on Dashboard config.
      ...(enableDynamicPm ? {} : { payment_method_types: ['card'] }),
      ...(enableDynamicPm && paymentMethodConfiguration
        ? { payment_method_configuration: paymentMethodConfiguration }
        : {}),
      invoice_creation: { enabled: true },
      allow_promotion_codes: true,
      billing_address_collection: billingAddress === 'required' ? 'required' : 'auto',
      ...(enableTaxId ? { tax_id_collection: { enabled: true } } : {}),

      ...(email ? { customer_email: email } : {}),

      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: getTourString(tour, 'title') || getTourString(tour, 'name') || slug,
              ...(description ? { description } : {}),
              metadata: { slug: (getTourString(tour, 'slug') || slug) },
            },
            unit_amount: unitAmount,
          },
          quantity: guests,
        },
      ],

      metadata: {
        deal_id: dealId ? String(dealId) : '',
        tour_id: String(getTourString(tour, 'id') ?? ''),
        tour_slug: (getTourString(tour, 'slug') || slug),
        slug: (getTourString(tour, 'slug') || slug),
        date,
        persons: String(guests),
        tour_title: getTourString(tour, 'title') || getTourString(tour, 'name') || '',
        tour_price_minor: String(unitAmount),
        origin_currency: 'EUR',
        currency: 'EUR',

        vid: utm.vid ? String(utm.vid) : '',
        utm_key,
        utm_source: utm.utm_source ? String(utm.utm_source) : '',
        utm_medium: utm.utm_medium ? String(utm.utm_medium) : '',
        utm_campaign: utm.utm_campaign ? String(utm.utm_campaign) : '',

        // Attribution (best-effort)
        landing_path: landing.landing_path ? String(landing.landing_path) : '',
        landing_at: landing.landing_at ? String(landing.landing_at) : '',
        first_cta: mt.first.cta ? String(mt.first.cta) : '',
        first_cta_page: mt.first.cta_page ? String(mt.first.cta_page) : '',
        first_cta_at: mt.first.cta_at ? String(mt.first.cta_at) : '',
        last_cta: mt.last.cta ? String(mt.last.cta) : '',
        last_cta_page: mt.last.cta_page ? String(mt.last.cta_page) : '',
        last_cta_at: mt.last.cta_at ? String(mt.last.cta_at) : '',
      },

      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    const session = await stripe.checkout.sessions.create(params);

    // Best-effort: avanzar deal a "checkout"
    try {
      const did =
        dealId || (typeof b.dealId === 'string' ? b.dealId.trim() : '');
      if (did) {
        const admin = getSupabaseAdmin();

        const fullUpdate: Record<string, unknown> = {
          stage: 'checkout',
          probability: 70,
          amount_minor: unitAmount,
          currency: 'eur',
          stripe_session_id: session.id,
          checkout_url: session.url || null,

          // Attribution (best-effort, non-PII). These columns are added by supabase_patch_p53/p54.
          landing_path: landing.landing_path,
          landing_at: landing.landing_at,
          first_cta: mt.first.cta,
          first_cta_page: mt.first.cta_page,
          first_cta_at: mt.first.cta_at,
          last_cta: mt.last.cta,
          last_cta_page: mt.last.cta_page,
          last_cta_at: mt.last.cta_at,

          // UTM keys (optional; if your deals table includes them)
          utm_source: utm.utm_source,
          utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign,
          utm_term: utm.utm_term,
          utm_content: utm.utm_content,
          gclid: utm.gclid,
          fbclid: utm.fbclid,
        };

        // Some environments may not have the newest attribution columns yet.
        // We try full update first; if Supabase complains about missing columns, retry with core fields only.
        const coreUpdate: Record<string, unknown> = {
          stage: 'checkout',
          probability: 70,
          amount_minor: unitAmount,
          currency: 'eur',
          stripe_session_id: session.id,
          checkout_url: session.url || null,
        };

        const r1 = await fromTable(admin, 'deals').update(fullUpdate as TablesUpdate<'deals'>).eq('id', did);
        if (r1?.error && typeof r1.error.message === 'string') {
          const msg = String(r1.error.message);
          if (msg.includes('does not exist') || msg.includes('column')) {
            await fromTable(admin, 'deals').update(coreUpdate as TablesUpdate<'deals'>).eq('id', did);
          }
        }
      }
    } catch {
      // ignore
    }

    void logEvent(
      'checkout.session_created',
      {
        request_id: requestId,
        tour_id: getTourString(tour, 'id'),
        tour_slug: (getTourString(tour, 'slug') || slug),
        date,
        persons: guests,
        stripe_session_id: session.id,
        vid: utm.vid,
        utm_key,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,

        landing_path: landing.landing_path,
        landing_at: landing.landing_at,
        first_cta: mt.first.cta,
        first_cta_page: mt.first.cta_page,
        first_cta_at: mt.first.cta_at,
        last_cta: mt.last.cta,
        last_cta_page: mt.last.cta_page,
        last_cta_at: mt.last.cta_at,
      },
      { source: 'api', entityId: session.id, dedupeKey: `checkout:session_created:${session.id}` },
    );

    return NextResponse.json(
      { url: session.url, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Checkout error';

    void logOpsIncident(req, {
      severity: 'critical',
      kind: 'checkout_error',
      message,
      fingerprint: requestId,
      meta: { route: '/api/checkout' },
    });

    void logEvent(
      'api.error',
      { request_id: requestId, route: '/api/checkout', error: message },
      { source: 'api', dedupeKey: `api.error:/api/checkout:${requestId}` },
    );

    return NextResponse.json(
      { error: message, requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
