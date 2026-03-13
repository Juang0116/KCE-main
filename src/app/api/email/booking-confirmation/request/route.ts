// src/app/api/email/booking-confirmation/request/route.ts
import 'server-only';

import crypto from 'node:crypto';

import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

import { corsHeaders, corsPreflight } from '@/lib/cors';
import { SITE_URL, serverEnv } from '@/lib/env';
import { assertOpsNotPaused } from '@/lib/opsCircuitBreaker.server';
import { logOpsIncident } from '@/lib/opsIncidents.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { logEvent } from '@/lib/events.server';
import { getStripe } from '@/lib/stripe.server';
import { signLinkToken } from '@/lib/linkTokens.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { fromTable } from '@/lib/supabaseTyped.server';
import { buildInvoicePdf, buildInvoiceFileName } from '@/services/invoice';

import type Stripe from 'stripe';
import type { CreateEmailOptions } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const isProd = process.env.NODE_ENV === 'production';

const BASE_URL = (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /\/+$/,
  '',
);
const LOGO_URL = `${BASE_URL}/logo.png`;

const Input = z.object({
  session_id: z.string().trim().min(10),
});

function reqId() {
  return globalThis.crypto && 'randomUUID' in globalThis.crypto
    ? globalThis.crypto.randomUUID()
    : crypto.randomUUID();
}

function safeStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sameOriginOk(req: NextRequest): boolean {
  // In prod we allow only same-origin Origin/Referer (or missing, e.g. SSR).
  if (!isProd) return true;
  const baseHost = new URL(BASE_URL).host;

  const origin = safeStr(req.headers.get('origin'));
  const referer = safeStr(req.headers.get('referer'));

  const bad = (v: string) => {
    if (!v) return false;
    try {
      return new URL(v).host !== baseHost;
    } catch {
      return true;
    }
  };

  return !bad(origin) && !bad(referer);
}

async function tryLockEmail(sessionId: string, requestId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  try {
    const ins = await admin.from('event_locks').insert({ key: `email_confirm:${sessionId}` });
    if (!ins.error) return true;

    const code = (ins.error as unknown as { code?: string }).code;
    if (code === '23505') return false;

    void logEvent(
      'lock.error',
      { request_id: requestId, key: `email_confirm:${sessionId}`, message: ins.error.message },
      { source: 'api' },
    );
    // fail-open
    return true;
  } catch (e) {
    void logEvent(
      'lock.error',
      {
        request_id: requestId,
        key: `email_confirm:${sessionId}`,
        message: e instanceof Error ? e.message : String(e),
      },
      { source: 'api' },
    );
    return true;
  }
}

async function upsertBookingBestEffort(session: Stripe.Checkout.Session, requestId: string) {
  const admin = getSupabaseAdmin();
  const md = (session.metadata ?? {}) as Record<string, string | undefined>;

  const tour_id = safeStr(md.tour_id) || null;
  const date = safeStr(md.date) || new Date().toISOString().slice(0, 10);
  const persons = Math.max(1, Number.parseInt(safeStr(md.persons || md.quantity || '1'), 10) || 1);

  const customer_email = safeStr(session.customer_details?.email ?? session.customer_email) || null;
  const customer_name = safeStr(session.customer_details?.name) || null;

  const currency = safeStr(session.currency || '').toUpperCase() || 'EUR';
  const total = typeof session.amount_total === 'number' ? Math.trunc(session.amount_total) : null;
  const stripe_session_id = safeStr(session.id) || null;

  if (!stripe_session_id) return null;

  const extras = {
    payment_status: session.payment_status ?? null,
    meta: Object.fromEntries(
      Object.entries(md)
        .map(([k, v]) => [k, safeStr(v)])
        .filter(([, v]) => v),
    ),
  };

  try {
    const res = await fromTable(admin, 'bookings')
      .upsert(
        {
          tour_id,
          date,
          persons,
          status: 'paid',
          total,
          currency,
          origin_currency: currency,
          tour_price_minor: md.tour_price_minor ? Number(md.tour_price_minor) : null,
          payment_provider: 'stripe',
          stripe_session_id,
          customer_email,
          customer_name,
          extras: extras as any,
          user_id: null,
          deal_id: safeStr(md.deal_id || md.dealId) || null,
        },
        { onConflict: 'stripe_session_id' },
      )
      .select('id')
      .maybeSingle();

    if (res.error) {
      void logEvent(
        'bookings.upsert_error',
        { request_id: requestId, message: res.error.message, stripe_session_id },
        { source: 'api' },
      );
      return null;
    }
    return (res.data as any)?.id ?? null;
  } catch (e) {
    void logEvent(
      'bookings.upsert_error',
      { request_id: requestId, message: e instanceof Error ? e.message : String(e), stripe_session_id },
      { source: 'api' },
    );
    return null;
  }
}

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req, { methods: 'POST,OPTIONS' });
}

export async function POST(req: NextRequest) {
  const requestId = reqId();

  // Abuse controls
  const rl = await checkRateLimit(req, {
    action: 'email.booking_confirmation.request',
    limit: 3,
    windowSeconds: 60 * 60,
    identity: 'ip+vid',
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests', requestId },
      { status: 429, headers: corsHeaders(req, { methods: 'POST,OPTIONS' }) },
    );
  }

  if (!sameOriginOk(req)) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden', requestId },
      { status: 403, headers: corsHeaders(req, { methods: 'POST,OPTIONS' }) },
    );
  }

  const RESEND_API_KEY = safeStr(process.env.RESEND_API_KEY);
  const EMAIL_FROM = safeStr(process.env.EMAIL_FROM);
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    return NextResponse.json(
      { ok: false, error: 'Email not configured', requestId },
      { status: 500, headers: corsHeaders(req, { methods: 'POST,OPTIONS' }) },
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { ok: false, error: 'Stripe not configured', requestId },
      { status: 503, headers: corsHeaders(req, { methods: 'POST,OPTIONS' }) },
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', details: parsed.error.flatten(), requestId },
      { status: 400, headers: corsHeaders(req, { methods: 'POST,OPTIONS' }) },
    );
  }

  const sessionId = parsed.data.session_id;

  // Ops pause
  const pause = await assertOpsNotPaused(req, 'email');
  if (!pause.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Email sending temporarily paused. Please try again shortly.',
        requestId,
        pausedUntil: pause.pausedUntil ?? null,
        reason: pause.reason ?? null,
      },
      { status: 503, headers: corsHeaders(req, { methods: 'POST,OPTIONS' }) },
    );
  }

  // Idempotency: avoid duplicate sends on refresh
  const locked = await tryLockEmail(sessionId, requestId);
  if (!locked) {
    return NextResponse.json(
      { ok: true, alreadySent: true, requestId },
      { status: 200, headers: corsHeaders(req, { methods: 'POST,OPTIONS' }) },
    );
  }

  const stripe = getStripe();
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer_details'],
    });
  } catch (e) {
    void logOpsIncident(req, {
      severity: 'warn',
      kind: 'email_send_error',
      message: e instanceof Error ? e.message : 'Stripe lookup failed',
      fingerprint: `stripe_lookup:${sessionId}`,
      meta: { sessionId },
    });
    return NextResponse.json(
      { ok: false, error: 'Stripe lookup failed', requestId },
      { status: 502, headers: corsHeaders(req, { methods: 'POST,OPTIONS' }) },
    );
  }

  if (session.payment_status && session.payment_status !== 'paid') {
    return NextResponse.json(
      { ok: false, error: 'Payment not completed', payment_status: session.payment_status, requestId },
      { status: 403, headers: corsHeaders(req, { methods: 'POST,OPTIONS' }) },
    );
  }

  const to = safeStr(session.customer_details?.email ?? session.customer_email);
  if (!to) {
    return NextResponse.json(
      { ok: false, error: 'No email found on Stripe session', requestId },
      { status: 400, headers: corsHeaders(req, { methods: 'POST,OPTIONS' }) },
    );
  }

  const md = (session.metadata ?? {}) as Record<string, string | undefined>;
  const tourTitle = safeStr(md.tour_title || md.title) || 'Tu tour';
  const date = safeStr(md.date || md.tour_date);
  const persons = Math.max(1, Number.parseInt(safeStr(md.persons || md.quantity || '1'), 10) || 1);

  const linkSecret = safeStr(serverEnv.LINK_TOKEN_SECRET);
  const token = linkSecret
    ? signLinkToken({ sessionId: session.id, secret: linkSecret, ttlSeconds: 60 * 60 * 24 * 30 })
    : '';

  const bookingUrl = token
    ? `${BASE_URL}/booking/${encodeURIComponent(session.id)}?t=${encodeURIComponent(token)}`
    : `${BASE_URL}/booking/${encodeURIComponent(session.id)}`;
  const invoiceUrl = token
    ? `${BASE_URL}/api/invoice/${encodeURIComponent(session.id)}?t=${encodeURIComponent(token)}&download=1`
    : `${BASE_URL}/api/invoice/${encodeURIComponent(session.id)}?download=1`;

  // Best-effort: persist booking so booking page works even if webhook is misconfigured.
  const bookingId = await upsertBookingBestEffort(session, requestId);

  // Build PDF (best-effort)
  let invoicePdf: Buffer | null = null;
  let issuedAt = new Date();
  try {
    if (typeof session.created === 'number') issuedAt = new Date(session.created * 1000);

    const totalMinor = typeof session.amount_total === 'number' ? session.amount_total : 0;
    const currency = (session.currency || 'EUR').toUpperCase();

    invoicePdf = await buildInvoicePdf(
      {
        bookingId: session.id,
        createdAtISO: issuedAt.toISOString(),
        buyer: {
          name: safeStr(session.customer_details?.name) || null,
          email: to || null,
        },
        tourTitle,
        tourDate: date || null,
        persons,
        totalMinor,
        currency,
        locale: 'es-ES',
        paymentProvider: 'stripe',
        paymentRef: session.id,
        siteUrl: BASE_URL,
      },
      {
        logoUrl: LOGO_URL,
        showQr: true,
        qrUrl: bookingUrl,
        qrLabel: 'Gestiona tu reserva',
      },
    );
  } catch (e) {
    invoicePdf = null;
    void logEvent(
      'email.booking_confirmation.pdf_failed',
      { request_id: requestId, message: e instanceof Error ? e.message : String(e) },
      { source: 'api' },
    );
  }

  const subject = `Confirmación de reserva · ${tourTitle} | KCE`;

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 12px 0;">Reserva confirmada</h2>
      <p style="margin:0 0 16px 0;color:#334155;">Gracias por reservar con <strong>KCE</strong>. Aquí están los detalles:</p>
      <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
        <p style="margin:0 0 8px 0;"><strong>Tour:</strong> ${escapeHtml(tourTitle)}</p>
        ${date ? `<p style="margin:0 0 8px 0;"><strong>Fecha:</strong> ${escapeHtml(date)}</p>` : ''}
        <p style="margin:0;"><strong>Personas:</strong> ${escapeHtml(String(persons))}</p>
        ${bookingId ? `<p style="margin:12px 0 0 0;color:#64748b;font-size:12px;">Booking ID: ${escapeHtml(bookingId)}</p>` : ''}
      </div>
      <p style="margin:18px 0 0 0;display:flex;gap:10px;flex-wrap:wrap;">
        <a href="${bookingUrl}" style="display:inline-block;background:#0f172a;color:white;text-decoration:none;padding:10px 14px;border-radius:10px;">Ver / gestionar reserva</a>
        <a href="${invoiceUrl}" style="display:inline-block;background:#0D5BA1;color:white;text-decoration:none;padding:10px 14px;border-radius:10px;">Descargar factura (PDF)</a>
      </p>
      <p style="margin:20px 0 0 0;color:#64748b;font-size:12px;">Si necesitas ayuda, responde a este correo o abre el chat en la web.</p>
    </div>
  `.trim();

  const text = [
    '¡Reserva confirmada!',
    '',
    `Tour: ${tourTitle}`,
    date ? `Fecha: ${date}` : '',
    `Personas: ${persons}`,
    bookingId ? `Booking ID: ${bookingId}` : '',
    '',
    `Gestiona tu reserva: ${bookingUrl}`,
    `Descarga factura (PDF): ${invoiceUrl}`,
    '',
    'Equipo KCE',
  ]
    .filter(Boolean)
    .join('\n');

  const resend = new Resend(RESEND_API_KEY);
  const replyTo = safeStr(process.env.EMAIL_REPLY_TO) || undefined;

  const payload: CreateEmailOptions = {
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
    ...(invoicePdf
      ? {
          attachments: [
            {
              filename: buildInvoiceFileName(tourTitle, issuedAt),
              content: invoicePdf.toString('base64'),
              contentType: 'application/pdf',
            },
          ],
        }
      : {}),
  };

  const send = await resend.emails.send(payload);
  if (send.error) {
    void logOpsIncident(req, {
      severity: 'warn',
      kind: 'email_send_error',
      message: send.error.message,
      fingerprint: `email_send:${sessionId}`,
      meta: { to, sessionId },
    });
    void logEvent(
      'email.booking_confirmation.error',
      { request_id: requestId, to, message: send.error.message },
      { source: 'api' },
    );
    return NextResponse.json(
      { ok: false, error: send.error.message, requestId },
      { status: 502, headers: corsHeaders(req, { methods: 'POST,OPTIONS' }) },
    );
  }

  void logEvent(
    'email.booking_confirmation.sent',
    {
      request_id: requestId,
      to,
      booking_id: bookingId,
      has_pdf: !!invoicePdf,
      has_secure_links: !!token,
      session_id: sessionId,
    },
    { source: 'api', entityId: sessionId, dedupeKey: `email:booking_confirmation:sent:${sessionId}` },
  );

  return NextResponse.json(
    { ok: true, requestId, to, bookingId, hasPdf: !!invoicePdf },
    { status: 200, headers: corsHeaders(req, { methods: 'POST,OPTIONS' }) },
  );
}
