// src/app/api/calendar/[session_id]/route.ts
import 'server-only';

import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { serverEnv, isProd, SITE_URL } from '@/lib/env';
import { verifyLinkToken } from '@/lib/linkTokens.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ session_id: string }> };

const BASE_URL = (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

function json(data: any, status: number, requestId: string) {
  return NextResponse.json(data, { status, headers: withRequestId(undefined, requestId) });
}

function tokenFromReferer(req: NextRequest): string {
  const ref = (req.headers.get('referer') || '').trim();
  if (!ref) return '';
  try {
    const u = new URL(ref);
    return (u.searchParams.get('t') || '').trim();
  } catch {
    return '';
  }
}

function icsEscape(input: string) {
  return String(input || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function yyyymmdd(dateISO: string) {
  // dateISO expected: YYYY-MM-DD
  const [y, m, d] = String(dateISO || '').split('-');
  if (!y || !m || !d) return '';
  return `${y}${m}${d}`;
}

function contentDisposition(filename: string) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, '_');
  const utf8 = encodeURIComponent(safe)
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
  return `attachment; filename="${safe}"; filename*=UTF-8''${utf8}`;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const requestId = getRequestId(req.headers);

  const admin = getSupabaseAdmin();
  if (!admin) return json({ error: 'Supabase admin not configured' }, 503, requestId);

  const { session_id } = await ctx.params;
  const sessionId = String(session_id || '').trim();
  if (!sessionId) return json({ error: 'Missing session_id' }, 400, requestId);

  const internalKey = (req.headers.get('x-internal-key') || '').trim();
  const internalOk = !!(
    serverEnv.INTERNAL_API_KEY &&
    internalKey &&
    internalKey === serverEnv.INTERNAL_API_KEY
  );

  const secret = (serverEnv.LINK_TOKEN_SECRET || '').trim();
  const tokenQuery = (req.nextUrl.searchParams.get('t') || '').trim();
  const token = tokenQuery || tokenFromReferer(req);

  if (isProd && !internalOk) {
    if (!secret) return json({ error: 'LINK_TOKEN_SECRET not set' }, 500, requestId);

    const v = verifyLinkToken({ token, secret, expectedSessionId: sessionId });
    if (!v.ok) return json({ error: 'Forbidden', reason: v.reason }, 403, requestId);
  }

  const { data, error } = await admin
    .from('bookings')
    .select(
      'id,status,date,persons,total,currency,customer_email,customer_name,phone,extras,created_at,tour:tour_id(id,slug,title,summary,city)',
    )
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500, requestId);
  if (!data) return json({ error: 'Not found' }, 404, requestId);

  const tourTitle = String((data as any).tour?.title || 'Tour KCE');
  const city = String((data as any).tour?.city || '');
  const dateISO = String((data as any).date || '');
  const dt = yyyymmdd(dateISO);
  if (!dt) return json({ error: 'Invalid booking date' }, 500, requestId);

  // All-day event: DTEND is next day
  const d = new Date(`${dateISO}T00:00:00.000Z`);
  const next = new Date(d.getTime() + 24 * 60 * 60 * 1000);
  const dtEnd = `${next.getUTCFullYear()}${String(next.getUTCMonth() + 1).padStart(2, '0')}${String(
    next.getUTCDate(),
  ).padStart(2, '0')}`;

  const uid = crypto.createHash('sha256').update(`kce:${sessionId}`).digest('hex').slice(0, 24);
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');

  const bookingUrl = new URL(`/booking/${encodeURIComponent(sessionId)}`, BASE_URL);
  if (tokenQuery) bookingUrl.searchParams.set('t', tokenQuery);

  const descriptionLines = [
    'Reserva confirmada con Knowing Cultures Enterprise (KCE).',
    `Tour: ${tourTitle}`,
    city ? `Ciudad: ${city}` : '',
    '',
    'Detalles y factura:',
    bookingUrl.toString(),
    '',
    'Nota: La hora exacta y el punto de encuentro se confirman por WhatsApp/Email.',
  ].filter(Boolean);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KCE//Booking//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@kce`,
    `DTSTAMP:${stamp}`,
    `SUMMARY:${icsEscape(tourTitle)}`,
    `DTSTART;VALUE=DATE:${dt}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    city ? `LOCATION:${icsEscape(city + ', Colombia')}` : '',
    `DESCRIPTION:${icsEscape(descriptionLines.join('\n'))}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ]
    .filter(Boolean)
    .join('\r\n');

  const filename = `KCE-Booking-${sessionId}.ics`;

  return new NextResponse(ics, {
    status: 200,
    headers: withRequestId(
      {
        'content-type': 'text/calendar; charset=utf-8',
        'content-disposition': contentDisposition(filename),
        'cache-control': 'no-store',
      },
      requestId,
    ),
  });
}
