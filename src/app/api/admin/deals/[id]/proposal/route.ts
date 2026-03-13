// src/app/api/admin/deals/[id]/proposal/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getTourBySlug } from '@/features/tours/catalog.server';
import { requireAdminScope } from '@/lib/adminAuth';
import { createTask } from '@/lib/botStorage.server';
import { publicEnv } from '@/lib/env';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getStripe } from '@/lib/stripe.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });

const BodySchema = z
  .object({
    slug: z.string().trim().min(1),
    date: z.string().trim().min(1),
    guests: z.coerce.number().int().min(1).max(20).default(1),
    locale: z.string().trim().optional(),
    customerName: z.string().trim().max(120).optional(),
    email: z.string().trim().email().optional(),
    includeCheckoutLink: z.boolean().optional(),
  })
  .strict();

function clampInt(n: unknown, min: number, max: number, fallback: number) {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

function fmtMoneyMinor(amountMinor: number, locale: string, currency = 'EUR') {
  const cur = currency.toUpperCase();
  try {
    return new Intl.NumberFormat(locale || 'es-CO', { style: 'currency', currency: cur }).format(
      amountMinor / 100,
    );
  } catch {
    return `${(amountMinor / 100).toFixed(2)} ${cur}`;
  }
}

function pickLang(localeRaw?: string) {
  const l = (localeRaw || '').toLowerCase();
  if (l.startsWith('de')) return 'de';
  if (l.startsWith('en')) return 'en';
  return 'es';
}

function buildProposalText(args: {
  lang: 'es' | 'en' | 'de';
  customerName?: string;
  tourTitle: string;
  city?: string | null;
  summary?: string | null;
  durationHours?: number | null;
  date: string;
  guests: number;
  pricePerPersonMinor: number;
  checkoutUrl?: string | null;
}) {
  const {
    lang,
    customerName,
    tourTitle,
    city,
    summary,
    durationHours,
    date,
    guests,
    pricePerPersonMinor,
    checkoutUrl,
  } = args;

  const locale = lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'es-CO';
  const pp = fmtMoneyMinor(pricePerPersonMinor, locale, 'EUR');
  const total = fmtMoneyMinor(pricePerPersonMinor * guests, locale, 'EUR');

  const name = (customerName || '').trim();
  const hi = lang === 'en' ? 'Hi' : lang === 'de' ? 'Hallo' : 'Hola';
  const greet = name ? `${hi} ${name},` : `${hi},`;

  const titleLine = city ? `${tourTitle} — ${city}` : tourTitle;

  const dur =
    typeof durationHours === 'number' && Number.isFinite(durationHours) && durationHours > 0
      ? durationHours
      : null;

  const durLine =
    dur && lang === 'en'
      ? `Duration: ${dur}h`
      : dur && lang === 'de'
        ? `Dauer: ${dur} Std.`
        : dur
          ? `Duración: ${dur}h`
          : null;

  const summaryLine = summary ? summary.trim() : '';

  const bullets =
    lang === 'en'
      ? [
          `Tour: ${titleLine}`,
          `Date: ${date}`,
          `People: ${guests}`,
          ...(durLine ? [durLine] : []),
          `Price per person: ${pp} (EUR)`,
          `Total: ${total} (EUR)`,
        ]
      : lang === 'de'
        ? [
            `Tour: ${titleLine}`,
            `Datum: ${date}`,
            `Personen: ${guests}`,
            ...(durLine ? [durLine] : []),
            `Preis pro Person: ${pp} (EUR)`,
            `Gesamt: ${total} (EUR)`,
          ]
        : [
            `Tour: ${titleLine}`,
            `Fecha: ${date}`,
            `Personas: ${guests}`,
            ...(durLine ? [durLine] : []),
            `Precio por persona: ${pp} (EUR)`,
            `Total: ${total} (EUR)`,
          ];

  const intro =
    lang === 'en'
      ? "Here’s the proposal with price and availability details:"
      : lang === 'de'
        ? 'Hier ist das Angebot mit Preis und Verfügbarkeitsdetails:'
        : 'Te comparto la propuesta con precio y disponibilidad:';

  const nextStep =
    lang === 'en'
      ? checkoutUrl
        ? `To confirm your booking, use this secure payment link:\n${checkoutUrl}\n\nOnce paid, you’ll receive your invoice and a calendar invite.`
        : 'If everything looks good, tell me and I’ll send you the secure payment link to confirm your booking (invoice + calendar invite).'
      : lang === 'de'
        ? checkoutUrl
          ? `Zur Bestätigung kannst du sicher hier bezahlen:\n${checkoutUrl}\n\nNach Zahlung erhältst du Rechnung und Kalendereinladung.`
          : 'Wenn alles passt, sag kurz Bescheid – dann schicke ich dir den sicheren Zahlungslink zur Buchungsbestätigung (Rechnung + Kalendereinladung).'
        : checkoutUrl
          ? `Para confirmar tu reserva, puedes pagar de forma segura aquí:\n${checkoutUrl}\n\nAl pagar, recibes factura y evento de calendario.`
          : 'Si todo te parece bien, dime y te envío el link seguro de pago para confirmar tu reserva (factura + evento de calendario).';

  const sign = '\n\n— KCE | Knowing Cultures Enterprise';

  const body = [
    greet,
    '',
    intro,
    '',
    ...(summaryLine ? [summaryLine, ''] : []),
    ...bullets.map((b) => `• ${b}`),
    '',
    nextStep,
    sign,
  ].join('\n');

  return body;
}

async function updateDealStage(args: {
  dealId: string;
  stage: 'proposal' | 'checkout';
  amountMinor: number;
  probability: number;
  requestId: string;
}) {
  try {
    const admin = getSupabaseAdmin() as any;
    if (!admin) return;
    await admin
      .from('deals')
      .update({
        stage: args.stage,
        probability: args.probability,
        amount_minor: args.amountMinor,
        currency: 'eur',
      })
      .eq('id', args.dealId);
  } catch (err) {
    await logEvent(
      'api.error',
      {
        requestId: args.requestId,
        route: '/api/admin/deals/[id]/proposal',
        message: err instanceof Error ? err.message : 'update deal failed',
      },
      { source: 'api' },
    );
  }
}

async function createFollowupTasks(args: {
  dealId: string;
  requestId: string;
  kind: 'proposal' | 'checkout';
}) {
  const now = Date.now();
  if (args.kind === 'checkout') {
    await createTask({
      dealId: args.dealId,
      title: 'Revisar checkout/pago (6h)',
      priority: 'urgent',
      dueAt: new Date(now + 6 * 60 * 60 * 1000).toISOString(),
      requestId: args.requestId,
    });
    return;
  }

  await createTask({
    dealId: args.dealId,
    title: 'Confirmar recepción propuesta (48h)',
    priority: 'normal',
    dueAt: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
    requestId: args.requestId,
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const { id } = await ctx.params;
    const p = ParamsSchema.safeParse({ id });
    if (!p.success) {
      return NextResponse.json(
        { error: 'Bad params', details: p.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const raw = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(raw ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const dealId = p.data.id;
    const lang = pickLang(parsed.data.locale);
    const guests = clampInt(parsed.data.guests, 1, 20, 1);

    const tour = await getTourBySlug(parsed.data.slug);
    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found', requestId },
        { status: 404, headers: withRequestId(undefined, requestId) },
      );
    }

    const pricePerPersonMinor =
      typeof (tour as any).base_price === 'number'
        ? Math.round((tour as any).base_price)
        : Math.round(Number((tour as any).price ?? 0));

    if (!Number.isFinite(pricePerPersonMinor) || pricePerPersonMinor <= 0) {
      return NextResponse.json(
        { error: 'Tour price not configured', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const includeCheckout = Boolean(parsed.data.includeCheckoutLink);

    let checkoutUrl: string | null = null;
    let stripeSessionId: string | null = null;

    if (includeCheckout) {
      const stripe = getStripe();
      const origin = (publicEnv.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
      const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&tour=${encodeURIComponent(
        tour.slug,
      )}&date=${encodeURIComponent(parsed.data.date)}&q=${encodeURIComponent(String(guests))}`;

      const cancelUrl = `${origin}/checkout/cancel?tour=${encodeURIComponent(
        tour.slug,
      )}&date=${encodeURIComponent(parsed.data.date)}&q=${encodeURIComponent(String(guests))}&reason=user_canceled`;

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        invoice_creation: { enabled: true },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        ...(parsed.data.email ? { customer_email: parsed.data.email } : {}),
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: tour.title,
                description: (tour as any).summary || undefined,
                metadata: { slug: tour.slug },
              },
              unit_amount: Math.round(pricePerPersonMinor),
            },
            quantity: guests,
          },
        ],
        metadata: {
          deal_id: dealId,
          tour_id: String((tour as any).id ?? ''),
          tour_slug: tour.slug,
          slug: tour.slug,
          date: parsed.data.date,
          persons: String(guests),
          tour_title: tour.title,
          tour_price_minor: String(Math.round(pricePerPersonMinor)),
          origin_currency: 'EUR',
          currency: 'EUR',
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      checkoutUrl = session.url ? String(session.url) : null;
      stripeSessionId = session.id;

      void logEvent(
        'crm.checkout_session_created',
        { requestId, deal_id: dealId, stripe_session_id: session.id, tour_slug: tour.slug },
        { source: 'crm', entityId: dealId, dedupeKey: `crm:checkout:${session.id}` },
      );
    }

    // ✅ FIX exactOptionalPropertyTypes: no pases customerName: undefined, omite la key
    const customerName = parsed.data.customerName?.trim();

    const city = ((tour as any).city ?? null) as string | null;
    const summary = ((tour as any).summary ?? null) as string | null;
    const durationHours = ((tour as any).duration_hours ?? null) as number | null;

    const text = buildProposalText({
      lang,
      ...(customerName ? { customerName } : {}),
      tourTitle: tour.title,
      city,
      summary,
      durationHours,
      date: parsed.data.date,
      guests,
      pricePerPersonMinor,
      checkoutUrl,
    });

    void logEvent(
      'crm.proposal_generated',
      {
        requestId,
        deal_id: dealId,
        tour_slug: tour.slug,
        date: parsed.data.date,
        persons: guests,
        include_checkout: includeCheckout,
        stripe_session_id: stripeSessionId,
      },
      { source: 'crm', entityId: dealId, dedupeKey: `crm:proposal:${dealId}:${requestId}` },
    );

    void updateDealStage({
      dealId,
      stage: includeCheckout ? 'checkout' : 'proposal',
      amountMinor: pricePerPersonMinor,
      probability: includeCheckout ? 70 : 55,
      requestId,
    });

    void createFollowupTasks({ dealId, requestId, kind: includeCheckout ? 'checkout' : 'proposal' });

    return NextResponse.json(
      { ok: true, text, checkoutUrl, stripeSessionId, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/deals/[id]/proposal',
        message: e instanceof Error ? e.message : 'unknown',
      },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
