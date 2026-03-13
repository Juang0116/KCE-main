// src/lib/signedActions.server.ts
import 'server-only';

import crypto from 'node:crypto';
import { getSupabaseAdminAny } from '@/lib/supabaseAdminAny.server';

type PayloadV1 = {
  v: 1;
  aud: 'admin';
  actor: string;
  exp: number; // unix seconds
  nonce: string; // random hex
};

function b64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlDecode(s: string) {
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

function hmac(secret: string, msg: string) {
  return crypto.createHmac('sha256', secret).update(msg).digest();
}

function safeEq(a: string, b: string) {
  // Buffer.from expects string, not string|undefined.
  const ab = Buffer.from(String(a ?? ''), 'utf8');
  const bb = Buffer.from(String(b ?? ''), 'utf8');
  // timingSafeEqual throws if lengths differ
  if (ab.length !== bb.length) return false;
  try {
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

function clampTtl(ttl: number) {
  // clamp 30s..10m
  return Math.max(30, Math.min(600, ttl));
}

export function mintAdminActionToken(actor: string, ttlSeconds?: number): { token: string; exp: number } {
  const secret = (process.env.SIGNED_ACTIONS_SECRET || '').trim();
  if (!secret) throw new Error('SIGNED_ACTIONS_SECRET missing');

  const ttlRaw = Number(ttlSeconds ?? process.env.SIGNED_ACTIONS_TTL_SECONDS ?? 120);
  const ttl = clampTtl(Number.isFinite(ttlRaw) ? ttlRaw : 120);

  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttl;

  const payload: PayloadV1 = {
    v: 1,
    aud: 'admin',
    actor: String(actor || '').trim(),
    exp,
    nonce: crypto.randomBytes(16).toString('hex'),
  };

  if (!payload.actor) throw new Error('actor required');

  const body = b64url(JSON.stringify(payload));
  const sig = b64url(hmac(secret, body));
  return { token: `${body}.${sig}`, exp };
}

export async function verifyAndConsumeAdminActionToken(
  token: string,
): Promise<{ ok: true; payload: PayloadV1 } | { ok: false; code: string; message: string }> {
  const secret = (process.env.SIGNED_ACTIONS_SECRET || '').trim();
  if (!secret) return { ok: false, code: 'SIGNED_ACTIONS_MISCONFIG', message: 'SIGNED_ACTIONS_SECRET missing' };

  const raw = String(token || '').trim();
  const parts = raw.split('.');
  if (parts.length !== 2) return { ok: false, code: 'BAD_TOKEN', message: 'Malformed token.' };

  const body = parts[0] || '';
  const sig = parts[1] || '';
  if (!body || !sig) return { ok: false, code: 'BAD_TOKEN', message: 'Malformed token.' };

  const expected = b64url(hmac(secret, body));
  if (!safeEq(sig, expected)) {
    return { ok: false, code: 'BAD_SIGNATURE', message: 'Invalid signature.' };
  }

  let payload: PayloadV1 | null = null;
  try {
    payload = JSON.parse(b64urlDecode(body).toString('utf-8')) as PayloadV1;
  } catch {
    return { ok: false, code: 'BAD_PAYLOAD', message: 'Invalid payload.' };
  }

  if (
    !payload ||
    payload.v !== 1 ||
    payload.aud !== 'admin' ||
    typeof payload.actor !== 'string' ||
    !payload.actor ||
    typeof payload.nonce !== 'string' ||
    !payload.nonce ||
    typeof payload.exp !== 'number'
  ) {
    return { ok: false, code: 'BAD_PAYLOAD', message: 'Invalid payload.' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return { ok: false, code: 'TOKEN_EXPIRED', message: 'Token expired.' };

  // Replay protection: store nonce (unique).
  try {
    const admin = getSupabaseAdminAny();
    if (!admin) return { ok: false, code: 'NONCE_STORE_FAILED', message: 'Supabase admin not configured.' };

    const ins = await (admin as any).from('action_nonces').insert({
      nonce: payload.nonce,
      actor: payload.actor,
      exp_at: new Date(payload.exp * 1000).toISOString(),
      created_at: new Date().toISOString(),
    });

    if (ins?.error) {
      const msg = String(ins.error.message || '').toLowerCase();
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('23505')) {
        return { ok: false, code: 'REPLAY', message: 'Token replay detected.' };
      }
      return { ok: false, code: 'NONCE_STORE_FAILED', message: 'Nonce store failed.' };
    }
  } catch {
    return { ok: false, code: 'NONCE_STORE_FAILED', message: 'Nonce store failed.' };
  }

  return { ok: true, payload };
}
