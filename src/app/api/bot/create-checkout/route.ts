// src/app/api/bot/create-checkout/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getTourBySlug } from '@/features/tours/catalog.server';
import { jsonError, contentLengthBytes } from '@/lib/apiErrors';
import { getRequestChannel } from '@/lib/requestGuards.server';
import { getLocalePrefix, getRequestOrigin } from '@/lib/requestUrl.server';
import { logEvent } from '@/lib/events.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { enforceCostBudget } from '@/lib/costBudget.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getStripe } from '@/lib/stripe.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { fromTable } from '@/lib/supabaseTyped.server';
import type { TablesUpdate } from '@/types/supabase';
import { readUtmFromCookies, utmCompactKey } from '@/lib/utm.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clampInt(n: unknown, min: number, max: number, fallback: number) {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(v)));
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


const BodySchema = z.object({
  dealId: z.string().min(6).max(64).optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/i),
  date: z.string().trim().min(8).max(32),
  guests: z.number().int().min(1).max(20).optional(),
  email: z.string().trim().email().optional(),
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const channel = getRequestChannel(req);

  const rl = await checkRateLimit(req, {
    action: 'bot.create_checkout.'+channel,
    limit: 20,
    windowSeconds: 60 * 60,
    identity: 'ip+vid',
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', requestId },
      { status: 429, headers: withRequestId(undefined, requestId) },
    );
  }
  const budget = await enforceCostBudget(req, 'bot_checkout');
  if (!budget.allowed) {
    return NextResponse.json(
      { error: 'Daily budget exceeded', requestId },
      { status: 429, headers: withRequestId(undefined, requestId) },
    );
  }


  const clen = contentLengthBytes(req);
  if (clen && clen > 6_000) {
    return jsonError(req, {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Payload too large.',
      requestId,
    });
  }

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid body',
        errorCode: 'INVALID_INPUT',
        details: parsed.error.flatten(),
        requestId,
      },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const { slug, date, email, dealId } = parsed.data;
  const guests = clampInt(parsed.data.guests ?? 1, 1, 20, 1);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Invalid date (expected YYYY-MM-DD)', requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const tour = await getTourBySlug(slug);
  if (!tour) {
    return NextResponse.json(
      { error: 'Tour not found', requestId },
      { status: 404, headers: withRequestId(undefined, requestId) },
    );
  }

  const price = getTourNumber(tour, 'base_price') ?? getTourNumber(tour, 'price') ?? 0;

  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json(
      { error: 'Tour price not configured', requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const stripe = getStripe();

  const origin = getRequestOrigin(req);
  const localePrefix = getLocalePrefix(req);

  // UTM attribution (cookie)
  const utm = readUtmFromCookies(req);
  const utm_key = utmCompactKey(utm);

  const successUrl = `${origin}${localePrefix}/checkout/success?session_id={CHECKOUT_SESSION_ID}&tour=${encodeURIComponent(
    slug,
  )}&date=${encodeURIComponent(date)}&q=${encodeURIComponent(String(guests))}`;

  const cancelUrl = `${origin}${localePrefix}/checkout/cancel?tour=${encodeURIComponent(
    slug,
  )}&date=${encodeURIComponent(date)}&q=${encodeURIComponent(String(guests))}&reason=user_canceled`;

  const productDescription = getTourString(tour, 'summary') || getTourString(tour, 'short') || '';

  void logEvent(
    'bot.checkout_started',
    {
      requestId,
      tour_slug: slug,
      tour_id: getTourString(tour, 'id') ?? null,
      date,
      persons: guests,
      vid: utm.vid,
      utm_key,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
    },
    { source: 'bot', dedupeKey: `bot:checkout_started:${requestId}` },
  );

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    invoice_creation: { enabled: true },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    ...(email ? { customer_email: email } : {}),

    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: getTourString(tour, 'title') || getTourString(tour, 'name') || slug,
            ...(productDescription ? { description: productDescription } : {}),
            metadata: { slug },
          },
          unit_amount: Math.round(price),
        },
        quantity: guests,
      },
    ],

    metadata: {
      deal_id: dealId ? String(dealId) : '',
      tour_id: String(getTourString(tour, 'id') ?? ''),
      tour_slug: slug,
      slug,
      date,
      persons: String(guests),
      tour_title: getTourString(tour, 'title') || getTourString(tour, 'name') || '',
      tour_price_minor: String(Math.round(price)),
      origin_currency: 'EUR',
      currency: 'EUR',

      // Attribution
      vid: utm.vid ? String(utm.vid) : '',
      utm_key,
      utm_source: utm.utm_source ? String(utm.utm_source) : '',
      utm_medium: utm.utm_medium ? String(utm.utm_medium) : '',
      utm_campaign: utm.utm_campaign ? String(utm.utm_campaign) : '',
    },

    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  // Best-effort: avanzar deal a "checkout" cuando se crea sesión
  try {
    const id = (dealId || '').trim();
    if (id) {
      const admin = getSupabaseAdmin();
      if (!admin) {
        // en algunos entornos puede ser null; no bloqueamos checkout
      } else {
        await fromTable(admin, 'deals')
          .update({
            stage: 'checkout',
            probability: 70,
            amount_minor: Math.round(price),
            currency: 'eur',
          } as TablesUpdate<'deals'>)
          .eq('id', id);
      }
    }
  } catch {
    // ignore
  }

  void logEvent(
    'bot.checkout_session_created',
    {
      requestId,
      tour_slug: slug,
      tour_id: getTourString(tour, 'id') ?? null,
      stripe_session_id: session.id,
      vid: utm.vid,
      utm_key,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
    },
    { source: 'bot', dedupeKey: `bot:checkout_session:${session.id}` },
  );

  return NextResponse.json(
    { ok: true, url: session.url, sessionId: session.id, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
