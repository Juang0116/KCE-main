// src/app/api/email/booking-confirmation/route.ts
import 'server-only';

import crypto from 'node:crypto';

import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

import { corsHeaders, corsPreflight } from '@/lib/cors';
import { SITE_URL, serverEnv } from '@/lib/env';
import { assertOpsNotPaused } from '@/lib/opsCircuitBreaker.server';
import { verifyLinkToken } from '@/lib/linkTokens.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getStripe } from '@/lib/stripe.server';
import { buildInvoicePdf, buildInvoiceFileName } from '@/services/invoice';

import type Stripe from 'stripe';

export const runtime = 'nodejs';

/* ─────────────────────────────────────────────────────────────
   Config & helpers
   ───────────────────────────────────────────────────────────── */

const isProd = process.env.NODE_ENV === 'production';

const ZERO_DECIMAL = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
]);

const BASE_URL = (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /\/+$/,
  '',
);
const LOGO_URL = `${BASE_URL}/logo.png`;

function json(req: NextRequest, data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders(req, { methods: 'POST,OPTIONS' }),
      ...extra,
    },
  });
}

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req, { methods: 'POST,OPTIONS' });
}

function guessLocaleForMoney(stripeLocale?: string | null) {
  const s = String(stripeLocale || '').trim().toLowerCase();
  if (s.startsWith('de')) return 'de-DE';
  if (s.startsWith('fr')) return 'fr-FR';
  if (s.startsWith('en')) return 'en-IE';
  return 'es-ES';
}

function formatAmount(amountInMinor: number, currency: string, stripeLocale?: string | null) {
  const c = currency.toLowerCase();
  const value = ZERO_DECIMAL.has(c) ? amountInMinor : amountInMinor / 100;

  const digits = ZERO_DECIMAL.has(c) ? 0 : 2;

  return new Intl.NumberFormat(guessLocaleForMoney(stripeLocale), {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]!,
  );
}

const isStripePlaceholderSession = (id?: string) => {
  const v = (id || '').trim();
  return !v || v === '{CHECKOUT_SESSION_ID}' || /^\{.+\}$/.test(v);
};

const reqId = () => crypto.randomUUID();

/* ─────────────────────────────────────────────────────────────
   Input: JSON o FormData + validación
   ───────────────────────────────────────────────────────────── */

const Input = z.object({
  // En prod lo exigimos (más abajo). Aquí lo dejamos optional para soportar dev/testing.
  session_id: z.string().trim().min(1).optional(),
  // Signed link token (required in prod)
  t: z.string().trim().min(10).optional(),

  // NOTA: En producción NO usaremos email del cliente (anti-spam).
  email: z.string().email().optional(),

  tour: z.string().trim().min(1).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // YYYY-MM-DD
  people: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().int().min(1).max(99).optional(),
  ),
});

function stripEmptyStrings(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      const s = v.trim();
      out[k] = s === '' ? undefined : s;
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function readInput(req: NextRequest) {
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  let raw: Record<string, unknown> = {};

  if (ct.includes('application/json')) {
    try {
      raw = (await req.json()) ?? {};
    } catch {
      /* ignore */
    }
  } else {
    try {
      const form = await req.formData();
      form.forEach((v, k) => (raw[k] = String(v)));
    } catch {
      /* ignore */
    }
  }

  const cleaned = stripEmptyStrings(raw);
  const parsed = Input.safeParse(cleaned);

  if (!parsed.success) return { error: parsed.error.flatten(), data: null as null };
  return { error: null as null, data: parsed.data };
}

/* ─────────────────────────────────────────────────────────────
   POST /api/email/booking-confirmation
   ───────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const requestId = reqId();

  const rl = await checkRateLimit(req, {
    action: 'email.booking_confirmation',
    limit: 3,
    windowSeconds: 60 * 60,
    identity: 'ip+vid',
  });
  if (!rl.allowed) {
    return json(req, { error: 'Too many requests', requestId }, 429, { 'X-Request-ID': requestId });
  }

  // Anti-abuso básico en navegador (si viene Origin/Referer)
  // (si falta, típicamente es server-to-server o curl; lo permitimos)
  const origin = (req.headers.get('origin') || '').trim();
  const referer = (req.headers.get('referer') || '').trim();
  if (isProd) {
    const baseHost = new URL(BASE_URL).host;
    const badOrigin =
      origin &&
      (() => {
        try {
          return new URL(origin).host !== baseHost;
        } catch {
          return true;
        }
      })();
    const badReferer =
      referer &&
      (() => {
        try {
          return new URL(referer).host !== baseHost;
        } catch {
          return true;
        }
      })();
    if (badOrigin || badReferer) {
      return json(req, { error: 'Forbidden', requestId }, 403, { 'X-Request-ID': requestId });
    }
  }

  const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
  if (!RESEND_API_KEY) {
    return json(req, { error: 'RESEND_API_KEY not set', requestId }, 500, {
      'X-Request-ID': requestId,
    });
  }

  const { data: input, error: inputErr } = await readInput(req);
  if (inputErr) {
    return json(req, { error: 'Invalid body', details: inputErr, requestId }, 400, {
      'X-Request-ID': requestId,
    });
  }

  const { t, email, session_id: sessionIdIn, tour: tourIn, date: dateIn, people: peopleIn } = input;

  let session_id = sessionIdIn;
  let tour = tourIn;
  let date = dateIn;
  let people = peopleIn;

  // Normaliza session_id
  if (isStripePlaceholderSession(session_id)) session_id = undefined;

  // En producción: NO permitimos envío sin session_id real (evita spam / relay).
  if (isProd && !session_id) {
    return json(
      req,
      {
        error: 'Missing session_id',
        hint: 'Este endpoint requiere un session_id válido de Stripe en producción.',
        requestId,
      },
      400,
      { 'X-Request-ID': requestId },
    );
  }

  // Security: signed link token required in production (unless internal key).
  const internalKey = (req.headers.get('x-internal-key') || '').trim();
  const internalOk = !!(
    serverEnv.INTERNAL_API_KEY &&
    internalKey &&
    internalKey === serverEnv.INTERNAL_API_KEY
  );
  if (isProd && !internalOk) {
    const secret = (serverEnv.LINK_TOKEN_SECRET || '').trim();
    if (!secret)
      return json(req, { error: 'LINK_TOKEN_SECRET not set', requestId }, 500, {
        'X-Request-ID': requestId,
      });
    const v = verifyLinkToken({
      token: String(t || '').trim(),
      secret,
      expectedSessionId: String(session_id),
    });
    if (!v.ok)
      return json(req, { error: 'Forbidden', reason: v.reason, requestId }, 403, {
        'X-Request-ID': requestId,
      });
  }

  // Datos desde Stripe (fuente de verdad)
  let chargedAmount: string | undefined;
  let currencyUpper: string | undefined;
  let session: Stripe.Checkout.Session | null = null;

  // Importante: solo tomamos "to" desde Stripe en prod.
  let to = isProd ? '' : (email || '').trim();

  try {
    if (process.env.STRIPE_SECRET_KEY && session_id) {
      const stripe = getStripe();
      session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['payment_intent'] });

      const stripeEmail = session.customer_details?.email || session.customer_email || '';

      if (isProd) {
        to = stripeEmail;
      } else {
        // En dev: si llega email manual, lo dejamos; si no, tomamos el de Stripe.
        to = to || stripeEmail;
      }

      if (session.amount_total != null && session.currency) {
        const stripeLocale = (session as unknown as { locale?: string | null }).locale ?? null;
        chargedAmount = formatAmount(session.amount_total, session.currency, stripeLocale);
        currencyUpper = session.currency.toUpperCase();
      }

      const md = (session.metadata || {}) as Record<string, string | undefined>;
      tour = tour || md.tour_title || undefined;
      date = date || md.date || undefined;

      // people: input > metadata
      if (!people && md.quantity) {
        const n = Number(md.quantity);
        if (Number.isFinite(n) && n > 0) people = n;
      }
    }
  } catch (e) {
    // En prod, si no podemos resolver Stripe, no enviamos (evita abuso y datos incompletos)
    if (isProd) {
      return json(req, { error: 'Stripe lookup failed', requestId }, 502, {
        'X-Request-ID': requestId,
      });
    }
    // En dev: permitimos continuar con lo que haya

    console.error('[email] stripe lookup error:', e);
  }

  if (!to) {
    return json(
      req,
      {
        error: 'No email available',
        hint: 'Se requiere un session_id válido de Stripe para obtener el correo del cliente.',
        requestId,
      },
      400,
      { 'X-Request-ID': requestId },
    );
  }

  const qty = typeof people === 'number' && people > 0 ? people : undefined;

  // Link real para tu app (existe /checkout/success)
  const manageUrl = (() => {
    const u = new URL('/checkout/success', BASE_URL);
    if (session_id) u.searchParams.set('session_id', session_id);
    if (tour) u.searchParams.set('tour', tour);
    if (date) u.searchParams.set('date', date);
    if (qty) u.searchParams.set('q', String(qty));
    return u.toString();
  })();

  // Para subject/text: NO escapamos HTML
  const rawTour = tour || '';
  const rawDate = date || '';

  const subject =
    `KCE — Confirmación de reserva` +
    (rawTour ? `: ${rawTour}` : '') +
    (rawDate ? ` (${rawDate})` : '');

  const text = [
    '¡Gracias por tu reserva con Knowing Cultures Enterprise!',
    rawTour ? `• Tour: ${rawTour}` : undefined,
    rawDate ? `• Fecha: ${rawDate}` : undefined,
    qty ? `• Personas: ${qty}` : undefined,
    chargedAmount ? `• Monto: ${chargedAmount}` : undefined,
    '',
    'Adjuntamos tu factura en PDF.',
    `Puedes ver tu confirmación aquí: ${manageUrl}`,
    'Si necesitas ajustar algo, responde este correo o abre el chat en la web.',
    '— Equipo KCE',
  ]
    .filter(Boolean)
    .join('\n');

  // Para HTML: escapamos
  const safeTourHtml = rawTour ? escapeHtml(rawTour) : '';
  const safeDateHtml = rawDate ? escapeHtml(rawDate) : '';

  const html = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7FAFC;padding:24px 0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;box-shadow:0 4px 16px rgba(17,24,39,.08);overflow:hidden">
          <tr>
            <td style="background:#0D5BA1;color:#fff;padding:20px 24px">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <div style="font-weight:700;font-size:18px;letter-spacing:.2px">Knowing Cultures Enterprise</div>
                <img src="${LOGO_URL}" alt="KCE" height="28" style="display:block;border:0;outline:none"/>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827">
              <h1 style="margin:0 0 12px 0;font-size:22px;color:#0D5BA1">¡Gracias por tu reserva!</h1>
              <p style="margin:0 0 12px 0">Te confirmamos tu experiencia con KCE.</p>

              <ul style="margin:0;padding-left:18px;line-height:1.6">
                ${safeTourHtml ? `<li><strong>Tour:</strong> ${safeTourHtml}</li>` : ''}
                ${safeDateHtml ? `<li><strong>Fecha:</strong> ${safeDateHtml}</li>` : ''}
                ${qty ? `<li><strong>Personas:</strong> ${qty}</li>` : ''}
                ${chargedAmount ? `<li><strong>Monto:</strong> ${escapeHtml(chargedAmount)}</li>` : ''}
                ${currencyUpper ? `<li><strong>Moneda:</strong> ${escapeHtml(currencyUpper)}</li>` : ''}
              </ul>

              <p style="margin:16px 0">Adjuntamos tu factura en PDF. También puedes ver tu confirmación:</p>
              <p style="margin:0 0 20px 0">
                <a href="${manageUrl}" target="_blank" rel="noreferrer"
                   style="display:inline-block;background:#FFC300;color:#111827;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:700">
                  Abrir confirmación
                </a>
              </p>

              <p style="margin:0;color:#4B5563">Si necesitas ajustar algo, responde este correo o abre el chat en la web.</p>
              <p style="margin:16px 0 0 0;color:#4B5563">— Equipo Knowing Cultures Enterprise</p>
            </td>
          </tr>
          <tr>
            <td style="background:#F3F4F6;color:#6B7280;padding:14px 24px;font-size:12px;text-align:center">
              KCE • ${BASE_URL.replace(/^https?:\/\//, '')}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`.trim();

  // PDF (si falla, enviamos sin adjunto)
  let pdfBuffer: Buffer | null = null;
  let filename = 'Factura.pdf';

  try {
    const createdAt = session
      ? new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000)
      : rawDate
        ? new Date(`${rawDate}T00:00:00`)
        : new Date();

    pdfBuffer = await buildInvoicePdf(
      {
        bookingId: session_id || 'manual',
        createdAtISO: createdAt.toISOString(),
        buyer: {
          name: session?.customer_details?.name || null,
          email: to || null,
        },
        tourTitle: rawTour || 'Tour KCE',
        tourDate: rawDate || null,
        persons: qty || 1,
        totalMinor: session?.amount_total ?? null,
        currency: currencyUpper || session?.currency?.toUpperCase() || 'USD',
        locale: 'es-CO',
        siteUrl: BASE_URL,
      },
      {
        logoUrl: LOGO_URL,
        theme: { brandBlue: '#0D5BA1', brandYellow: '#FFC300', textDark: '#111827' },
        showQr: true,
        qrUrl: manageUrl,
        qrLabel: 'Ver confirmación',
      },
    );

    filename = buildInvoiceFileName(rawTour || 'Tour KCE', createdAt);
  } catch (err) {
    console.warn('[email] PDF build failed, sending without attachment:', err);
  }

  // Resend
  const fromEnv = (process.env.EMAIL_FROM || '').trim();
  const fallbackFrom = 'KCE <onboarding@resend.dev>';
  const replyTo = (process.env.EMAIL_REPLY_TO || '').trim() || undefined;

  // Ops circuit breaker: if email sending is paused, skip sending.
  const pause = await assertOpsNotPaused(req, 'email');
  if (!pause.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Email sending temporarily paused. Please try again shortly.',
        pausedUntil: pause.pausedUntil ?? null,
        reason: pause.reason ?? null,
      },
      { status: 503, headers: corsHeaders(req) },
    );
  }

  const resend = new Resend(RESEND_API_KEY);

  async function sendWith(fromAddr: string) {
    const options: Parameters<typeof resend.emails.send>[0] = {
      from: fromAddr,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(pdfBuffer
        ? {
            attachments: [
              {
                filename,
                content: pdfBuffer.toString('base64'),
                contentType: 'application/pdf',
              },
            ],
          }
        : {}),
    };
    return await resend.emails.send(options);
  }

  let triedFrom = fromEnv || fallbackFrom;
  let res = await sendWith(triedFrom);

  if (res.error && triedFrom !== fallbackFrom) {
    console.warn('[email] first send failed with from="%s": %s', triedFrom, res.error.message);
    triedFrom = fallbackFrom;
    res = await sendWith(triedFrom);
  }

  if (res.error) {
    console.error('[email] resend error:', res.error);
    return json(req, { error: res.error.message, triedFrom, requestId }, 500, {
      'X-Request-ID': requestId,
    });
  }

  // Respuesta: redirect si navegador, JSON si API
  const accept = (req.headers.get('accept') || '').toLowerCase();
  const wantsJson = accept.includes('application/json') || accept.includes('text/json');

  const redirectUrl = new URL('/checkout/success', req.url);
  redirectUrl.searchParams.set('sent', '1');
  if (session_id) redirectUrl.searchParams.set('session_id', session_id);
  if (rawTour) redirectUrl.searchParams.set('tour', rawTour);
  if (rawDate) redirectUrl.searchParams.set('date', rawDate);
  if (qty) redirectUrl.searchParams.set('q', String(qty));

  return wantsJson
    ? json(req, { ok: true, redirect: redirectUrl.pathname + redirectUrl.search, requestId }, 200, {
        'X-Request-ID': requestId,
      })
    : NextResponse.redirect(redirectUrl, { status: 303, headers: { 'X-Request-ID': requestId } });
}
