// src/app/api/webhooks/stripe/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import type { CreateEmailOptions } from 'resend';

import { serverEnv, SITE_URL } from '@/lib/env';
import { logEvent } from '@/lib/events.server';
import { signLinkToken } from '@/lib/linkTokens.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getStripe } from '@/lib/stripe.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { fromTable } from '@/lib/supabaseTyped.server';
import { buildInvoicePdf, buildInvoiceFileName } from '@/services/invoice';
import { attributeOutboundPaid } from '@/lib/outbound.server';
import type { Json, TablesInsert } from '@/types/supabase';
import { logOpsIncident } from '@/lib/opsIncidents.server';
import { assertOpsNotPaused } from '@/lib/opsCircuitBreaker.server';
import { cancelFollowupOnBooking } from '@/lib/followupAgent.server';
import { notifyOps } from '@/lib/opsNotify.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data: unknown, status = 200, requestId?: string) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...(requestId ? withRequestId(undefined, requestId) : {}),
    },
  });
}

function safeStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function upper(v: unknown): string {
  const s = safeStr(v);
  return s ? s.toUpperCase() : '';
}

function parseYMD(v: string): string | null {
  const s = v.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : s;
}

function getMeta(meta: Record<string, string | undefined>, ...keys: string[]) {
  for (const k of keys) {
    const v = safeStr(meta[k]);
    if (v) return v;
  }
  return '';
}

function parsePositiveInt(v: unknown, fallback = 1) {
  const n = Number.parseInt(String(v ?? '').trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ✅ JSON-safe meta (sin undefined)
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

async function tryLock(key: string, requestId: string) {
  const admin = getSupabaseAdmin();
  try {
    const ins = await admin.from('event_locks').insert({ key });
    if (!ins.error) return true;

    const code = (ins.error as unknown as { code?: string }).code;
    if (code === '23505') return false;

    void logEvent(
      'lock.error',
      { request_id: requestId, key, message: ins.error.message },
      { source: 'api' },
    );
    return true;
  } catch (e) {
    void logEvent(
      'lock.error',
      { request_id: requestId, key, message: e instanceof Error ? e.message : String(e) },
      { source: 'api' },
    );
    return true;
  }
}

async function upsertCustomerBestEffort(args: {
  email: string;
  name?: string | null;
  language?: string | null;
  requestId: string;
}) {
  const admin = getSupabaseAdmin();
  try {
    const email = args.email.trim().toLowerCase();
    if (!email) return;

    const res = await fromTable(admin, 'customers').upsert(
      {
        email,
        name: args.name ?? null,
        language: args.language ?? null,
      },
      { onConflict: 'email' },
    );

    if (res.error) {
      void logEvent(
        'customers.upsert_error',
        { request_id: args.requestId, email, message: res.error.message },
        { source: 'api' },
      );
    }
  } catch {
    // ignore
  }
}

async function upsertBookingFromSession(session: Stripe.Checkout.Session, requestId: string) {
  const admin = getSupabaseAdmin();

  const stripe_session_id = safeStr(session.id);
  if (!stripe_session_id) throw new Error('Missing session.id');

  const meta = (session.metadata ?? {}) as Record<string, string | undefined>;

  const deal_id = safeStr(getMeta(meta, 'deal_id', 'dealId')) || null;

  const tour_id = safeStr(getMeta(meta, 'tour_id')) || null;
  const tour_slug = safeStr(getMeta(meta, 'tour_slug', 'slug')) || null;
  const tour_title = safeStr(getMeta(meta, 'tour_title', 'title')) || null;

  const currency = upper(session.currency) || upper(getMeta(meta, 'currency')) || 'EUR';
  const origin_currency = upper(getMeta(meta, 'origin_currency', 'catalog_currency')) || currency;
  const tour_price_minor =
    parsePositiveInt(getMeta(meta, 'tour_price_minor', 'unit_amount') || '', 0) || null;

  const date =
    parseYMD(getMeta(meta, 'date', 'tour_date')) || new Date().toISOString().slice(0, 10);
  const persons = parsePositiveInt(getMeta(meta, 'persons', 'quantity', 'people', 'pax') || '1', 1);

  const customer_email = safeStr(session.customer_details?.email ?? session.customer_email) || null;
  const customer_name = safeStr(session.customer_details?.name) || null;

  const total = typeof session.amount_total === 'number' ? Math.trunc(session.amount_total) : null;

  if (customer_email) {
    const locale = (session as unknown as { locale?: string }).locale;
    const language = safeStr(locale || '') ? safeStr(locale || '').toLowerCase() : null;

    await upsertCustomerBestEffort({
      email: customer_email,
      name: customer_name,
      language,
      requestId,
    });
  }

  const lockKey = `booking:${stripe_session_id}`;
  const locked = await tryLock(lockKey, requestId);
  if (!locked) {
    const existing = await admin
      .from('bookings')
      .select('id')
      .eq('stripe_session_id', stripe_session_id)
      .maybeSingle();
    return existing.data?.id ?? null;
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const customerRef =
    typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? null);

  const metaJson = metaToJson(meta);

  const extras: Json = {
    tour_slug,
    tour_title,
    payment_status: session.payment_status ?? null,
    payment_intent_id: paymentIntentId,
    customer_id: customerRef,
    meta: metaJson,
  };

  const baseRow = {
    tour_id,
    date,
    persons,
    status: 'paid',
    total,
    currency,
    origin_currency,
    tour_price_minor,
    payment_provider: 'stripe',
    stripe_session_id,
    customer_email,
    customer_name,
    extras,
    user_id: null,
  };

  const rowWithDeal = deal_id ? { ...baseRow, deal_id } : baseRow;

  const tryUpsert = async (row: typeof baseRow | (typeof baseRow & { deal_id: string | null })) => {
    const res = await fromTable(admin, 'bookings')
      .upsert(row, { onConflict: 'stripe_session_id' })
      .select('id')
      .single();

    if (res.error) throw res.error;
    return res.data.id as string;
  };

  try {
    return await tryUpsert(rowWithDeal);
  } catch (e: unknown) {
    const msg =
      typeof (e as { message?: unknown })?.message === 'string'
        ? String((e as { message?: unknown }).message)
        : '';
    if (msg.toLowerCase().includes('deal_id')) {
      return await tryUpsert(baseRow);
    }
    throw e;
  }
}

async function markDealWonFromSession(
  session: Stripe.Checkout.Session,
  bookingId: string | null,
  requestId: string,
) {
  const admin = getSupabaseAdmin();
  const meta = (session.metadata ?? {}) as Record<string, string | undefined>;
  const deal_id = safeStr(getMeta(meta, 'deal_id', 'dealId')) || '';

  if (!deal_id) return;

  const lockKey = `deal_won:${deal_id}:${safeStr(session.id)}`;
  const locked = await tryLock(lockKey, requestId);
  if (!locked) return;

  const currency = (upper(session.currency) || 'EUR').toLowerCase();
  const amount_minor =
    typeof session.amount_total === 'number' ? Math.trunc(session.amount_total) : null;

  const upd = await fromTable(admin, 'deals')
    .update({
      stage: 'won',
      probability: 100,
      amount_minor,
      currency,
      closed_at: new Date().toISOString(),
    })
    .eq('id', deal_id);

  if (upd?.error) {
    void logEvent(
      'api.error',
      { request_id: requestId, route: 'markDealWon', message: upd.error.message, deal_id },
      { source: 'api' },
    );
    return;
  }
  try {
    await fromTable(admin, 'deal_notes').insert({
      deal_id,
      body: `Pago confirmado (Stripe). session_id=${safeStr(session.id)} booking_id=${bookingId ?? 'n/a'}`,
      created_by: 'system',
    });
  } catch {
    // ignore
  }

  // ✅ P4: cerrar tareas de “checkout/pago” una vez confirmado el pago (evita trabajo duplicado)
  try {
    const q = fromTable(admin, 'tasks')
      .update({ status: 'done' })
      .eq('deal_id', deal_id)
      .in('status', ['open', 'in_progress'])
      .or('title.ilike.%checkout%,title.ilike.%pago%,title.ilike.%payment%');
    await q;
  } catch {
    // ignore
  }

  const date = parseYMD(getMeta(meta, 'date', 'tour_date')) || null;
  const duePre = date ? new Date(`${date}T12:00:00Z`).getTime() - 24 * 3600 * 1000 : null;
  const duePost = date ? new Date(`${date}T12:00:00Z`).getTime() + 24 * 3600 * 1000 : null;

  const tasks: TablesInsert<'tasks'>[] = [
    {
      deal_id,
      title: `Confirmar detalles del tour (punto de encuentro / pickup). booking=${bookingId ?? ''}`,
      priority: 'high',
      due_at: duePre ? new Date(duePre).toISOString() : null,
      status: 'open',
    },
    {
      deal_id,
      title: `Pedir reseña + foto (post-tour). booking=${bookingId ?? ''}`,
      priority: 'normal',
      due_at: duePost ? new Date(duePost).toISOString() : null,
      status: 'open',
    },
    {
      deal_id,
      title: `Upsell: ofrecer extras / segundo tour (48h). booking=${bookingId ?? ''}`,
      priority: 'normal',
      due_at: duePost ? new Date(duePost + 24 * 3600 * 1000).toISOString() : null,
      status: 'open',
    },
  ];

  try {
    await admin.from('tasks').insert(tasks);
  } catch {
    // ignore
  }

  // ✅ P11: closed-loop attribution (most recent outbound → paid)
  try {
    await attributeOutboundPaid({ dealId: deal_id, bookingId, windowDays: 7, requestId });
  } catch {
    // ignore
  }
}

async function sendBookingEmail(
  req: NextRequest,
  session: Stripe.Checkout.Session,
  bookingId: string | null,
  requestId: string,
) {
  const apiKey = serverEnv.RESEND_API_KEY;
  const from = serverEnv.EMAIL_FROM;

  if (!apiKey || !from) return;

  const to = safeStr(session.customer_details?.email ?? session.customer_email);
  if (!to) return;

  const meta = (session.metadata ?? {}) as Record<string, string | undefined>;
  const tourTitle = getMeta(meta, 'tour_title', 'title') || 'Tu tour';
  const date = getMeta(meta, 'date', 'tour_date') || '';
  const personsRaw = getMeta(meta, 'persons', 'quantity', 'pax') || '1';
  const persons = Number.parseInt(String(personsRaw), 10) || 1;

  const isProd = process.env.NODE_ENV === 'production';

  // ✅ FIX TS2339: SITE_URL NO es parte de serverEnv; es export directo de env.ts
  const baseUrl = SITE_URL;

  const linkSecret = (serverEnv.LINK_TOKEN_SECRET || '').trim();
  const token = linkSecret
    ? signLinkToken({ sessionId: session.id, secret: linkSecret, ttlSeconds: 60 * 60 * 24 * 30 })
    : '';

  const bookingUrl = token
    ? `${baseUrl}/booking/${encodeURIComponent(session.id)}?t=${encodeURIComponent(token)}`
    : `${baseUrl}/booking/${encodeURIComponent(session.id)}`;

  const invoiceApiUrl = token
    ? `${baseUrl}/api/invoice/${encodeURIComponent(session.id)}?t=${encodeURIComponent(token)}&download=1`
    : `${baseUrl}/api/invoice/${encodeURIComponent(session.id)}?download=1`;

  const stripe = getStripe();
  let stripeInvoiceUrl: string | null = null;
  try {
    const sessionFull = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['invoice'],
    });
    const inv = (sessionFull as unknown as { invoice?: Stripe.Invoice | string | null }).invoice;
    if (inv && typeof inv !== 'string') {
      stripeInvoiceUrl = inv.hosted_invoice_url ?? null;
    } else {
      stripeInvoiceUrl = null;
    }
  } catch {
    stripeInvoiceUrl = null;
  }

  let invoicePdf: Buffer | null = null;
  let issuedAt = new Date();
  try {
    if (typeof session.created === 'number') issuedAt = new Date(session.created * 1000);

    const totalMinor = typeof session.amount_total === 'number' ? session.amount_total : 0;
    const currency = (session.currency || 'EUR').toUpperCase();

    const buyerName = safeStr(session.customer_details?.name) || null;
    const buyerEmail = safeStr(session.customer_details?.email) || to;

    invoicePdf = await buildInvoicePdf(
      {
        bookingId: session.id,
        createdAtISO: issuedAt.toISOString(),
        buyer: { name: buyerName, email: buyerEmail || null },
        tourTitle,
        tourDate: date || null,
        persons,
        totalMinor,
        currency,
        locale: 'es-ES',
        paymentProvider: 'stripe',
        paymentRef: session.id,
        siteUrl: baseUrl,
      },
      {
        showQr: true,
        qrUrl: bookingUrl,
        qrLabel: 'Gestiona tu reserva',
      },
    );
  } catch {
    invoicePdf = null;
  }

  const canShareLinks = !isProd || !!linkSecret;

  const subject = `Confirmación de reserva · ${tourTitle} | KCE`;

  const text = [
    `¡Reserva confirmada!`,
    ``,
    `Tour: ${tourTitle}`,
    date ? `Fecha: ${date}` : '',
    `Personas: ${persons}`,
    bookingId ? `Booking ID: ${bookingId}` : '',
    ``,
    canShareLinks ? `Gestiona tu reserva: ${bookingUrl}` : '',
    canShareLinks ? `Descarga factura (PDF): ${invoiceApiUrl}` : '',
    stripeInvoiceUrl ? `Factura (Stripe): ${stripeInvoiceUrl}` : '',
    ``,
    `Equipo KCE`,
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 12px 0;">Reserva confirmada</h2>
      <p style="margin:0 0 16px 0;color:#334155;">Gracias por reservar con <strong>KCE</strong>. Aquí están los detalles:</p>

      <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
        <p style="margin:0 0 8px 0;"><strong>Tour:</strong> ${escapeHtml(tourTitle)}</p>
        ${date ? `<p style="margin:0 0 8px 0;"><strong>Fecha:</strong> ${escapeHtml(date)}</p>` : ''}
        <p style="margin:0;"><strong>Personas:</strong> ${escapeHtml(String(persons))}</p>
        ${
          bookingId
            ? `<p style="margin:12px 0 0 0;color:#64748b;font-size:12px;">Booking ID: ${escapeHtml(bookingId)}</p>`
            : ''
        }
      </div>

      ${
        canShareLinks
          ? `
          <p style="margin:18px 0 0 0;display:flex;gap:10px;flex-wrap:wrap;">
            <a href="${bookingUrl}" style="display:inline-block;background:#0f172a;color:white;text-decoration:none;padding:10px 14px;border-radius:10px;">
              Ver / gestionar reserva
            </a>
            <a href="${invoiceApiUrl}" style="display:inline-block;background:#0D5BA1;color:white;text-decoration:none;padding:10px 14px;border-radius:10px;">
              Descargar factura (PDF)
            </a>
          </p>
          `
          : `
          <p style="margin:18px 0 0 0;color:#64748b;font-size:12px;">
            Nota: por seguridad, los enlaces de gestión/factura no están disponibles en este correo.
          </p>
          `
      }

      ${
        stripeInvoiceUrl
          ? `<p style="margin:12px 0 0 0;">
               <a href="${stripeInvoiceUrl}" style="color:#0D5BA1;text-decoration:underline;">
                 Ver factura en Stripe (opcional)
               </a>
             </p>`
          : ''
      }

      <p style="margin:20px 0 0 0;color:#64748b;font-size:12px;">
        Si necesitas ayuda, responde a este correo y te atendemos.
      </p>
    </div>
  `.trim();

  try {
    // Ops circuit breaker: if email is paused, do not attempt to send.
    const pause = await assertOpsNotPaused(req, 'email');
    if (!pause.ok) {
      void logOpsIncident(req, {
        severity: 'warn',
        kind: 'email_send_error',
        message: `Email sending paused (skip): ${pause.reason || 'ops pause'}`,
        actor: 'system',
        meta: { pausedUntil: pause.pausedUntil ?? null, bookingId, to },
        fingerprint: `paused:${bookingId || ''}:${String(to || '')}`,
      });
      return;
    }

    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    const payload: CreateEmailOptions = {
      from,
      to,
      subject,
      html,
      text,
      ...(serverEnv.EMAIL_REPLY_TO ? { replyTo: serverEnv.EMAIL_REPLY_TO } : {}),
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

    await resend.emails.send(payload);

    void logEvent(
      'email.booking_confirmation.sent',
      {
        request_id: requestId,
        to,
        booking_id: bookingId,
        stripe_invoice_url: stripeInvoiceUrl,
        has_pdf: !!invoicePdf,
        has_secure_links: canShareLinks,
      },
      { source: 'api' },
    );
  } catch (e) {
    void logOpsIncident(req, {
      severity: 'warn',
      kind: 'email_send_error',
      message: e instanceof Error ? e.message : String(e),
      fingerprint: safeStr(session.id) || requestId,
      meta: { to, bookingId, stripeSessionId: safeStr(session.id) },
    });

    void logEvent(
      'email.booking_confirmation.error',
      {
        request_id: requestId,
        to,
        booking_id: bookingId,
        message: e instanceof Error ? e.message : String(e),
      },
      { source: 'api' },
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const secret = serverEnv.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    void logOpsIncident(req, {
      severity: 'critical',
      kind: 'stripe_webhook_misconfig',
      message: 'Missing STRIPE_WEBHOOK_SECRET',
      fingerprint: 'stripe_webhook_secret_missing',
      meta: { route: '/api/webhooks/stripe' },
    });
    return json({ ok: false, requestId, error: 'Missing STRIPE_WEBHOOK_SECRET' }, 500, requestId);
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    void logOpsIncident(req, {
      severity: 'warn',
      kind: 'stripe_webhook_missing_signature',
      message: 'Missing stripe-signature header',
      fingerprint: requestId,
      meta: { route: '/api/webhooks/stripe' },
    });
    return json({ ok: false, requestId, error: 'Missing stripe-signature' }, 400, requestId);
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    void logOpsIncident(req, {
      severity: 'warn',
      kind: 'stripe_webhook_invalid_signature',
      message: msg || 'Invalid Stripe signature',
      fingerprint: requestId,
      meta: { route: '/api/webhooks/stripe' },
    });
    return json({ ok: false, requestId, error: 'Invalid signature', detail: msg }, 400, requestId);
  }

  void logEvent(
    'stripe.webhook_received',
    { request_id: requestId, id: event.id, type: event.type },
    { source: 'api', entityId: event.id, dedupeKey: `stripe:webhook_received:${event.id}` },
  );

  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === 'paid') {
        const bookingId = await upsertBookingFromSession(session, requestId);
        void logEvent(
          'checkout.paid',
          { request_id: requestId, session_id: session.id, booking_id: bookingId },
          {
            source: 'api',
            entityId: bookingId ?? session.id,
            dedupeKey: `checkout:paid:${session.id}`,
          },
        );

        await markDealWonFromSession(session, bookingId, requestId);
        await sendBookingEmail(req, session, bookingId, requestId);

        // Notify ops team of new booking
        void notifyOps({
          title: '🎉 Nueva reserva confirmada',
          severity: 'info',
          text: [
            `Tour: ${(session.metadata as any)?.tour_title || (session.metadata as any)?.tour_slug || '—'}`,
            `Fecha: ${(session.metadata as any)?.date || '—'}`,
            `Personas: ${(session.metadata as any)?.persons || '—'}`,
            `Email: ${session.customer_email || '—'}`,
            bookingId ? `Booking: ${bookingId}` : '',
          ].filter(Boolean).join('\n'),
          meta: { sessionId: session.id, bookingId },
        }).catch(() => null);

        // Cancel any active follow-up sequences — lead has converted
        void cancelFollowupOnBooking({
          dealId: (session.metadata?.deal_id as string | undefined) ?? null,
          leadId: (session.metadata?.lead_id as string | undefined) ?? null,
        }).catch((e) => console.error('[webhook] cancel followup failed:', e?.message));
      }
    }
  } catch (e) {
    void logOpsIncident(req, {
      severity: 'critical',
      kind: 'stripe_webhook_error',
      message: e instanceof Error ? e.message : String(e),
      fingerprint: event?.id || requestId,
      meta: { type: event?.type },
    });
    void logEvent(
      'stripe.webhook_error',
      {
        request_id: requestId,
        message: e instanceof Error ? e.message : String(e),
        type: event.type,
      },
      { source: 'api', entityId: event.id, dedupeKey: `stripe:webhook_error:${event.id}` },
    );
  }

  return json({ ok: true, requestId }, 200, requestId);
}
