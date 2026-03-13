// src/app/api/invoice/[session_id]/route.ts
import 'server-only';
import crypto from 'node:crypto';

import { NextResponse, type NextRequest } from 'next/server';

import { corsHeaders, corsPreflight } from '@/lib/cors';
import { serverEnv, isProd, SITE_URL } from '@/lib/env';
import { verifyLinkToken } from '@/lib/linkTokens.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getStripe } from '@/lib/stripe.server';
import { buildInvoicePdf, buildInvoiceFileName } from '@/services/invoice';

import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ───────── Config ───────── */
const BASE_URL = (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /\/+$/,
  '',
);
const LOGO_URL = `${BASE_URL}/logo.png`;

/** Request ID */
const reqId = () =>
  globalThis.crypto && 'randomUUID' in globalThis.crypto
    ? globalThis.crypto.randomUUID()
    : crypto.randomUUID();

function wantsJson(req: NextRequest) {
  const accept = (req.headers.get('accept') || '').toLowerCase();
  return accept.includes('application/json') || accept.includes('text/json');
}

function json(
  req: NextRequest,
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      Vary: 'Accept, Origin',
      ...corsHeaders(req),
      ...extraHeaders,
    },
  });
}

function sanitizeFilename(name: string) {
  return (
    (name || '')
      .replace(/[^\w.\-() ]+/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'archivo.pdf'
  );
}

function contentDisposition(filename: string, forceDownload: boolean) {
  const safe = sanitizeFilename(filename);
  const utf8 = encodeURIComponent(safe)
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
  const type = forceDownload ? 'attachment' : 'inline';
  return `${type}; filename="${safe}"; filename*=UTF-8''${utf8}`;
}

function isStripePlaceholderSession(id?: string | null) {
  const v = String(id || '').trim();
  return !v || v === '{CHECKOUT_SESSION_ID}' || /^\{.+\}$/.test(v);
}

/**
 * ✅ Robustez móvil:
 * Si no llega token por query (?t=...), intenta leerlo del Referer
 * SOLO si el referer es mismo origen y corresponde a /booking/<session_id>
 */
function tokenFromReferer(req: NextRequest, sessionId: string): string {
  const ref = (req.headers.get('referer') || '').trim();
  if (!ref) return '';

  try {
    const u = new URL(ref);

    // Mismo origen (tu dominio / base)
    const base = new URL(BASE_URL);
    if (u.origin !== base.origin) return '';

    // Debe ser una página de booking del mismo sessionId
    // Ej: /es/booking/<id> o /booking/<id>
    const p = u.pathname || '';
    if (
      !p.includes(`/booking/${encodeURIComponent(sessionId)}`) &&
      !p.includes(`/booking/${sessionId}`)
    )
      return '';

    return (u.searchParams.get('t') || '').trim();
  } catch {
    return '';
  }
}

/* ───────── OPTIONS ───────── */
export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req, { methods: 'GET,OPTIONS' });
}

/* ───────── GET ───────── */
export async function GET(req: NextRequest, ctx: { params: Promise<{ session_id: string }> }) {
  const { session_id } = await ctx.params;
  const requestId = reqId();

  const rl = await checkRateLimit(req as any, {
    action: 'invoice.get',
    limit: 20,
    windowSeconds: 60 * 60,
    identity: 'ip+vid',
  });

  if (!rl.allowed) {
    return wantsJson(req)
      ? json(req, { error: 'Too many requests', requestId }, 429, { 'X-Request-ID': requestId })
      : new NextResponse('Too many requests', {
          status: 429,
          headers: { ...corsHeaders(req), 'X-Request-ID': requestId },
        });
  }

  const { searchParams } = new URL(req.url);
  const forceDownload = ['1', 'true', 'yes'].includes(
    (searchParams.get('download') || '').toLowerCase(),
  );

  // Stripe requerido
  if (!process.env.STRIPE_SECRET_KEY) {
    return wantsJson(req)
      ? json(req, { error: 'Stripe not configured', requestId }, 503, { 'X-Request-ID': requestId })
      : new NextResponse('Stripe not configured', {
          status: 503,
          headers: { ...corsHeaders(req), 'X-Request-ID': requestId },
        });
  }

  if (isStripePlaceholderSession(session_id)) {
    return wantsJson(req)
      ? json(req, { error: 'Invalid session_id placeholder', requestId }, 400, {
          'X-Request-ID': requestId,
        })
      : new NextResponse('Invalid session_id placeholder', {
          status: 400,
          headers: { ...corsHeaders(req), 'X-Request-ID': requestId },
        });
  }

  // Security: token requerido en producción para acceso público (si no viene interno)
  const internalKey = (req.headers.get('x-internal-key') || '').trim();
  const internalOk = !!(
    serverEnv.INTERNAL_API_KEY &&
    internalKey &&
    internalKey === serverEnv.INTERNAL_API_KEY
  );

  const secret = (serverEnv.LINK_TOKEN_SECRET || '').trim();

  // ✅ token por query o fallback por referer (mismo origen)
  const tokenQuery = (searchParams.get('t') || '').trim();
  const token = tokenQuery || tokenFromReferer(req, session_id);

  if (isProd && !internalOk) {
    if (!secret) {
      return wantsJson(req)
        ? json(req, { error: 'LINK_TOKEN_SECRET not set', requestId }, 500, {
            'X-Request-ID': requestId,
          })
        : new NextResponse('Server misconfigured', {
            status: 500,
            headers: { ...corsHeaders(req), 'X-Request-ID': requestId },
          });
    }

    const v = verifyLinkToken({ token, secret, expectedSessionId: session_id });
    if (!v.ok) {
      return wantsJson(req)
        ? json(req, { error: 'Forbidden', reason: v.reason, requestId }, 403, {
            'X-Request-ID': requestId,
          })
        : new NextResponse('Forbidden', {
            status: 403,
            headers: { ...corsHeaders(req), 'X-Request-ID': requestId },
          });
    }
  }

  const stripe = getStripe();

  // 1) Recuperar sesión
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent', 'customer_details'],
    });
  } catch (e) {
    console.error('[invoice] stripe retrieve error:', e);
    return wantsJson(req)
      ? json(req, { error: 'Not found', requestId }, 404, { 'X-Request-ID': requestId })
      : new NextResponse('Not found', {
          status: 404,
          headers: { ...corsHeaders(req), 'X-Request-ID': requestId },
        });
  }

  // 2) Solo pagadas
  if (session.payment_status && session.payment_status !== 'paid') {
    return wantsJson(req)
      ? json(
          req,
          { error: 'Payment not completed', payment_status: session.payment_status, requestId },
          403,
          { 'X-Request-ID': requestId },
        )
      : new NextResponse('Payment not completed', {
          status: 403,
          headers: { ...corsHeaders(req), 'X-Request-ID': requestId },
        });
  }

  // 3) Line items
  let lineItems: Stripe.ApiList<Stripe.LineItem> | null = null;
  try {
    lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
  } catch (e) {
    console.warn('[invoice] listLineItems failed, using metadata fallback:', e);
  }

  const md = (session.metadata || {}) as Record<string, string | undefined>;

  const createdMs = (session.created ?? Math.floor(Date.now() / 1000)) * 1000;
  const createdAt = new Date(createdMs);
  const createdISO = createdAt.toISOString();

  const firstItem = lineItems?.data?.[0];
  const tourTitle = firstItem?.description || md.tour_title || md.slug || 'Tour KCE';

  const qty =
    (typeof firstItem?.quantity === 'number' && firstItem.quantity > 0
      ? firstItem.quantity
      : undefined) ??
    (md.quantity ? Number(md.quantity) : undefined) ??
    1;

  const tourDate = md.date || null;

  // 4) Construir PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await buildInvoicePdf(
      {
        bookingId: session.id,
        createdAtISO: createdISO,
        buyer: {
          name: session.customer_details?.name || null,
          email: session.customer_details?.email || session.customer_email || null,
        },
        tourTitle,
        tourDate,
        persons: qty,
        totalMinor: session.amount_total ?? null,
        currency: (session.currency || 'EUR').toUpperCase(),
        locale: 'es-ES',
        siteUrl: BASE_URL,
      },
      {
        logoUrl: LOGO_URL,
        theme: { brandBlue: '#0D5BA1', brandYellow: '#FFC300', textDark: '#111827' },
        showQr: true,
        // ✅ si token está presente, el QR apunta a booking con token
        qrUrl: token
          ? `${BASE_URL}/booking/${encodeURIComponent(session.id)}?t=${encodeURIComponent(token)}`
          : `${BASE_URL}/booking/${encodeURIComponent(session.id)}`,
        qrLabel: 'Gestiona tu reserva',
      },
    );
  } catch (e) {
    console.error('[invoice] build pdf error:', e);
    return wantsJson(req)
      ? json(req, { error: 'Failed to build PDF', requestId }, 500, { 'X-Request-ID': requestId })
      : new NextResponse('Failed to build PDF', {
          status: 500,
          headers: { ...corsHeaders(req), 'X-Request-ID': requestId },
        });
  }

  const bytes = new Uint8Array(pdfBuffer);
  const filename = sanitizeFilename(buildInvoiceFileName(tourTitle, createdAt));

  const headers: Record<string, string> = {
    'Content-Type': 'application/pdf',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    'Content-Length': String(bytes.byteLength),
    'Content-Disposition': contentDisposition(filename, forceDownload),
    'X-Invoice-Session': session.id,
    'X-Request-ID': requestId,
    Vary: 'Accept, Origin',
    ...corsHeaders(req),
  };

  if (typeof session.livemode === 'boolean')
    headers['X-Stripe-Livemode'] = String(session.livemode);

  return new NextResponse(bytes, { status: 200, headers });
}
