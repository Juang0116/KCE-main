// src/lib/requestGuards.server.ts
import 'server-only';

import type { NextRequest } from 'next/server';
import crypto from 'node:crypto';

import { jsonError, contentLengthBytes } from '@/lib/apiErrors';
import { getAllowedOrigins } from '@/lib/cors';

export function assertPayloadSize(req: NextRequest, maxBytes: number) {
  const n = contentLengthBytes(req);
  if (n > maxBytes) {
    return jsonError(req, {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: `Payload too large (max ${maxBytes} bytes)`,
    });
  }
  return null;
}

export type RequestChannel = 'web' | 'admin' | 'email' | 'whatsapp';

export function getRequestChannel(req: NextRequest): RequestChannel {
  const h = (req.headers.get('x-kce-channel') || '').trim().toLowerCase();
  if (h === 'web' || h === 'admin' || h === 'email' || h === 'whatsapp') return h;
  const ref = (req.headers.get('referer') || '').toLowerCase();
  if (ref.includes('/admin')) return 'admin';
  return 'web';
}

const SAFE_SLUG = /^[a-z0-9-]{1,160}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SAFE_LOCALE = /^[a-z]{2}(?:-[A-Z]{2})?$/;
const SAFE_PHONE = /^\+?[0-9]{6,18}$/;

export function assertSafeSlug(req: NextRequest, value: unknown, field = 'slug') {
  const v = String(value ?? '').trim();
  if (!v || v.length > 160 || !SAFE_SLUG.test(v)) {
    return jsonError(req, { status: 400, code: 'INVALID_INPUT', message: `Invalid ${field}` });
  }
  return null;
}

export function assertIsoDate(req: NextRequest, value: unknown, field = 'date') {
  const v = String(value ?? '').trim();
  if (!ISO_DATE.test(v)) {
    return jsonError(req, {
      status: 400,
      code: 'INVALID_INPUT',
      message: `Invalid ${field} (expected YYYY-MM-DD)`,
    });
  }
  return null;
}

export function assertSafeLocale(req: NextRequest, value: unknown, field = 'locale') {
  if (value == null) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (v.length > 10 || !SAFE_LOCALE.test(v)) {
    return jsonError(req, { status: 400, code: 'INVALID_INPUT', message: `Invalid ${field}` });
  }
  return null;
}

export function assertSafePhone(req: NextRequest, value: unknown, field = 'phone') {
  if (value == null) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (v.length > 20 || !SAFE_PHONE.test(v)) {
    return jsonError(req, { status: 400, code: 'INVALID_INPUT', message: `Invalid ${field}` });
  }
  return null;
}

function normalizeOrigin(value: string): string | null {
  try {
    const u = new URL(value);
    return u.origin;
  } catch {
    return null;
  }
}

function isDevOrigin(origin: string) {
  if (!origin) return false;
  if (origin.startsWith('http://localhost:')) return true;
  if (origin.startsWith('http://127.0.0.1:')) return true;
  if (/^http:\/\/192\.168\./.test(origin)) return true;
  return false;
}

export function assertAllowedOriginOrReferer(
  req: NextRequest,
  opts?: { allowMissing?: boolean; allowInternalHmac?: boolean },
) {
  const allowMissing = opts?.allowMissing ?? false;
  const allowInternalHmac = opts?.allowInternalHmac ?? false;

  if (allowInternalHmac && verifyInternalHmac(req)) return null;

  const origin = (req.headers.get('origin') || '').trim();
  const referer = (req.headers.get('referer') || '').trim();
  const fromOrigin = origin ? normalizeOrigin(origin) : null;
  const fromReferer = referer ? normalizeOrigin(referer) : null;

  if (!fromOrigin && !fromReferer) {
    if (allowMissing) return null;
    return jsonError(req, { status: 403, code: 'FORBIDDEN', message: 'Missing Origin/Referer.' });
  }

  const allowed = new Set<string>();
  for (const o of getAllowedOrigins()) allowed.add(o);

  const inProd = process.env.NODE_ENV === 'production';
  const candidate = fromOrigin || fromReferer || '';

  // Always allow same-origin requests. This prevents accidental lockouts in
  // production when the allowlist is not configured yet, and supports multi-alias
  // deployments (e.g., Vercel preview + custom domain).
  // NOTE: req.nextUrl.origin reflects the origin the request is addressed to.
  if (candidate && candidate === req.nextUrl.origin) return null;

  if (!allowed.size) {
    if (!inProd && isDevOrigin(candidate)) return null;
    if (!inProd) return null;
    return jsonError(req, { status: 403, code: 'FORBIDDEN', message: 'Origin not allowed.' });
  }

  if (!inProd && isDevOrigin(candidate)) return null;

  if (!allowed.has(candidate)) {
    return jsonError(req, { status: 403, code: 'FORBIDDEN', message: 'Origin not allowed.' });
  }

  return null;
}

function verifyInternalHmac(req: NextRequest): boolean {
  const secret = (process.env.INTERNAL_HMAC_SECRET || '').trim();
  if (!secret) return false;

  const ts = (req.headers.get('x-kce-ts') || '').trim();
  const sig = (req.headers.get('x-kce-sig') || '').trim();
  if (!ts || !sig) return false;

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - tsNum) > 300) return false;

  const msg = `${ts}.${req.nextUrl.pathname}.${req.method.toUpperCase()}`;
  const expected = crypto.createHmac('sha256', secret).update(msg).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
