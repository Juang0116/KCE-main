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

interface Check {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
  meta?: Record<string, unknown>;
}

const QuerySchema = z.object({
  session_id: z.string().trim().min(8),
  heal: z.preprocess((v) => String(v ?? '0'), z.enum(['0', '1'])).optional(),
  heal_email: z.preprocess((v) => String(v ?? '0'), z.enum(['0', '1'])).optional(),
});

const safeStr = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const parseYMD = (v: unknown) => {
  const s = safeStr(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};

function getBaseUrl() {
  const raw = (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  return (raw || 'http://localhost:3000').replace(/\/+$/, '');
}

/**
 * Reconstruye una reserva desde Stripe.
 */
async function healBookingFromStripe(session: Stripe.Checkout.Session, requestId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin no configurado');

  const meta = (session.metadata ?? {}) as Record<string, string | undefined>;
  const currency = (session.currency || 'eur').toUpperCase();
  
  const bookingRow: TablesInsert<'bookings'> = {
    stripe_session_id: session.id,
    tour_id: safeStr(meta.tour_id) || null,
    date: parseYMD(meta.date || meta.tour_date) || new Date().toISOString().slice(0, 10),
    persons: parseInt(safeStr(meta.persons || meta.pax || '1'), 10) || 1,
    status: 'paid',
    total: session.amount_total ?? 0,
    currency,
    origin_currency: currency,
    customer_email: session.customer_details?.email ?? session.customer_email ?? null,
    customer_name: session.customer_details?.name ?? null,
    deal_id: safeStr(meta.deal_id || meta.dealId) || null,
    extras: {
      source: 'qa_heal_tool',
      tour_title: safeStr(meta.tour_title || meta.title),
      payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
    } as Json,
  };

  const { data, error } = await fromTable(admin, 'bookings')
    .upsert(bookingRow, { onConflict: 'stripe_session_id' })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Query inválida', requestId }, { status: 400 });
  }

  const { session_id: sessionId, heal, heal_email: wantsHealEmail } = parsed.data;
  const checks: Check[] = [];
  const admin = getSupabaseAdmin();
  const stripe = getStripe();

  // --- Verificaciones de Entorno ---
  const stripeKeyOk = !!serverEnv.STRIPE_SECRET_KEY;
  checks.push({
    id: 'env.stripe',
    label: 'Stripe Configured',
    ok: stripeKeyOk,
    ...(stripeKeyOk ? {} : { detail: 'Missing STRIPE_SECRET_KEY' })
  });

  const resendOk = !!serverEnv.RESEND_API_KEY && !!serverEnv.EMAIL_FROM;
  checks.push({
    id: 'env.resend',
    label: 'Resend Configured',
    ok: resendOk,
    ...(resendOk ? {} : { detail: 'Missing RESEND_API_KEY or EMAIL_FROM' })
  });

  try {
    // 1. Stripe Session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer_details'],
    });

    checks.push({
      id: 'stripe.session',
      label: 'Stripe session retrieved',
      ok: true,
      meta: { status: session.payment_status, live: session.livemode }
    });

    // 2. Booking en Supabase
    let { data: booking } = await admin!
      .from('bookings')
      .select('id, status')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    // Lógica de Healing (si se solicita y falta la reserva)
    if (!booking && heal === '1' && session.payment_status === 'paid') {
      const newId = await healBookingFromStripe(session, requestId);
      booking = { id: newId, status: 'paid' };
      checks.push({ id: 'heal.booking', label: 'Self-heal: Booking created', ok: true });
    }

    const bookingExists = !!booking;
    checks.push({
      id: 'supabase.booking_exists',
      label: 'Booking row exists',
      ok: bookingExists,
      ...(!bookingExists ? { detail: 'No se encontró la reserva en la base de datos.' } : {}),
      ...(booking ? { meta: { id: booking.id, status: booking.status } } : {})
    });

    // 3. Webhook Event
    const { data: evPaid } = await admin!
      .from('events')
      .select('id')
      .eq('dedupe_key', `checkout:paid:${sessionId}`)
      .maybeSingle();

    const webhookOk = !!evPaid;
    checks.push({
      id: 'events.checkout_paid',
      label: 'Webhook event (paid) recorded',
      ok: webhookOk,
      ...(!webhookOk ? { detail: 'El evento de pago no llegó al webhook o falló.' } : {})
    });

    // 4. Token y Links
    const linkSecret = serverEnv.LINK_TOKEN_SECRET;
    const token = linkSecret ? signLinkToken({ sessionId, secret: linkSecret, ttlSeconds: 3600 }) : '';
    
    checks.push({
      id: 'links.token',
      label: 'Recovery links generated',
      ok: !!token,
      ...(!token ? { detail: 'Missing LINK_TOKEN_SECRET' } : {}),
      ...(token ? { meta: { 
        booking_url: `${getBaseUrl()}/booking/${sessionId}?t=${token}`,
        invoice_url: `${getBaseUrl()}/api/invoice/${sessionId}?t=${token}&download=1` 
      }} : {})
    });

    // 5. Heal Email (Opcional)
    if (wantsHealEmail === '1' && session.payment_status === 'paid') {
      const res = await fetch(`${getBaseUrl()}/api/email/booking-confirmation`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-internal-key': serverEnv.INTERNAL_API_KEY || '' 
        },
        body: JSON.stringify({ session_id: sessionId, t: token }),
      });
      checks.push({ id: 'heal.email', label: 'Self-heal: Re-send confirmation', ok: res.ok });
    }

    const overallOk = checks.every(c => c.ok);

    return NextResponse.json({
      ok: overallOk,
      requestId,
      checks,
      session_id: sessionId,
      next_actions: !overallOk ? [
        'Asegúrate de que el webhook de Stripe apunte a la URL correcta.',
        'Si el pago está en Stripe pero no hay reserva, usa heal=1.',
        'Revisa los logs de Ops para errores de "stripe_webhook_error".'
      ] : []
    }, { headers: withRequestId(undefined, requestId) });

  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      requestId, 
      error: error.message || 'Error en verificación' 
    }, { status: 500 });
  }
}