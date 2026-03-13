// src/lib/internalHmac.server.ts
import 'server-only';

import crypto from 'crypto';
import type { NextRequest } from 'next/server';

import { jsonError } from '@/lib/apiErrors';

function b64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function sha256Hex(buf: Buffer) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function timingSafeEq(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export type InternalHmacOpts = {
  /** When true, missing/invalid signature rejects with 401. When false, allows. Default: secret presence implies required=false unless env INTERNAL_HMAC_REQUIRED=1. */
  required?: boolean;
  /** Max allowed clock skew in seconds. Default 300s. */
  skewSeconds?: number;
};

/**
 * Optional internal-request authentication using HMAC signature.
 *
 * Caller provides headers:
 *  - x-kce-ts: unix seconds
 *  - x-kce-sig: base64url(hmac_sha256(secret, `${ts}.${method}.${path}.${bodySha256}`))
 *
 * Notes:
 *  - Designed to complement Bearer secrets for cron/admin endpoints.
 *  - Uses req.clone() so it won't consume the original request body.
 */
export async function requireInternalHmac(req: NextRequest, opts: InternalHmacOpts = {}) {
  const secret = process.env.INTERNAL_HMAC_SECRET || '';
  if (!secret) return null; // not configured

  const required =
    typeof opts.required === 'boolean'
      ? opts.required
      : String(process.env.INTERNAL_HMAC_REQUIRED || '').trim() === '1';

  const tsRaw = (req.headers.get('x-kce-ts') || '').trim();
  const sig = (req.headers.get('x-kce-sig') || '').trim();

  if (!tsRaw || !sig) {
    if (!required) return null;
    return jsonError(req, { status: 401, code: 'UNAUTHORIZED', message: 'Missing internal signature' });
  }

  const ts = Number(tsRaw);
  if (!Number.isFinite(ts) || ts <= 0) {
    if (!required) return null;
    return jsonError(req, { status: 401, code: 'UNAUTHORIZED', message: 'Invalid internal timestamp' });
  }

  const skew = typeof opts.skewSeconds === 'number' ? opts.skewSeconds : 300;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > skew) {
    if (!required) return null;
    return jsonError(req, { status: 401, code: 'UNAUTHORIZED', message: 'Internal signature expired' });
  }

  const u = new URL(req.url);
  const path = u.pathname + (u.search || '');

  const clone = req.clone();
  const bodyBuf = Buffer.from(await clone.arrayBuffer());
  const bodyHash = sha256Hex(bodyBuf);

  const base = `${ts}.${req.method.toUpperCase()}.${path}.${bodyHash}`;
  const expected = b64url(crypto.createHmac('sha256', secret).update(base).digest());

  if (!timingSafeEq(expected, sig)) {
    if (!required) return null;
    return jsonError(req, { status: 401, code: 'UNAUTHORIZED', message: 'Invalid internal signature' });
  }

  return null;
}

export function signInternalHmac(params: { ts: number; method: string; path: string; body?: Buffer; secret: string }) {
  const { ts, method, path, body, secret } = params;
  const bodyHash = sha256Hex(body || Buffer.alloc(0));
  const base = `${ts}.${method.toUpperCase()}.${path}.${bodyHash}`;
  const sig = b64url(crypto.createHmac('sha256', secret).update(base).digest());
  return { ts: String(ts), sig };
}
