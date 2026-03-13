// src/lib/linkTokens.server.ts
import 'server-only';
import crypto from 'node:crypto';

/**
 * Signed, time-bound token for protecting booking/invoice links.
 *
 * Format: base64url(payloadJSON).base64url(HMAC_SHA256(payloadB64))
 *
 * Notes:
 * - Keep payload small (we only need session id + expiry).
 * - Do NOT include PII in the token.
 */

export type LinkTokenPayload = {
  /** Stripe Checkout Session ID */
  sid: string;
  /** Unix seconds expiry */
  exp: number;
};

function b64urlEncode(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlDecode(s: string) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

function timingSafeEqual(a: Buffer, b: Buffer) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function signLinkToken(args: {
  sessionId: string;
  secret: string;
  ttlSeconds?: number;
}): string {
  const sid = String(args.sessionId || '').trim();
  if (!sid) throw new Error('signLinkToken: missing sessionId');
  const ttl = Math.max(60, Math.trunc(args.ttlSeconds ?? 60 * 60 * 24 * 14)); // default 14 days

  const payload: LinkTokenPayload = {
    sid,
    exp: Math.floor(Date.now() / 1000) + ttl,
  };

  const payloadB64 = b64urlEncode(Buffer.from(JSON.stringify(payload), 'utf8'));
  const mac = crypto.createHmac('sha256', args.secret).update(payloadB64).digest();
  const sigB64 = b64urlEncode(mac);
  return `${payloadB64}.${sigB64}`;
}

export function verifyLinkToken(args: {
  token: string;
  secret: string;
  expectedSessionId: string;
}): { ok: true; payload: LinkTokenPayload } | { ok: false; reason: string } {
  const token = String(args.token || '').trim();
  if (!token) return { ok: false, reason: 'missing_token' };

  const [payloadB64, sigB64] = token.split('.');
  if (!payloadB64 || !sigB64) return { ok: false, reason: 'bad_format' };

  let payload: LinkTokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString('utf8')) as LinkTokenPayload;
  } catch {
    return { ok: false, reason: 'bad_payload' };
  }

  if (!payload?.sid || typeof payload.exp !== 'number') return { ok: false, reason: 'bad_payload' };

  const mac = crypto.createHmac('sha256', args.secret).update(payloadB64).digest();

  const sig = b64urlDecode(sigB64);
  if (!timingSafeEqual(mac, sig)) return { ok: false, reason: 'bad_signature' };

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) return { ok: false, reason: 'expired' };

  const expectedSid = String(args.expectedSessionId || '').trim();
  if (!expectedSid) return { ok: false, reason: 'missing_expected_sid' };
  if (payload.sid !== expectedSid) return { ok: false, reason: 'sid_mismatch' };

  return { ok: true, payload };
}
