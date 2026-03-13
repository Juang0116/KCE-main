// src/lib/turnstile.server.ts
import 'server-only';

import type { NextRequest } from 'next/server';

import { getClientIp } from '@/lib/net';

export type TurnstileVerifyResult = {
  ok: boolean;
  errorCodes?: string[];
  challengeTs?: string;
  hostname?: string;
};

/**
 * Cloudflare Turnstile verification.
 *
 * Behavior:
 * - If TURNSTILE_SECRET_KEY is not set → verification is treated as "disabled" (returns ok=true).
 * - If TURNSTILE_ENFORCE is not enabled → you may pass a token to verify; missing token returns ok=true.
 * - If TURNSTILE_ENFORCE is enabled → missing/invalid token returns ok=false.
 */
export async function verifyTurnstile(
  req: NextRequest,
  token: string | null | undefined,
): Promise<TurnstileVerifyResult> {
  const secret = (process.env.TURNSTILE_SECRET_KEY || '').trim();
  const enforceRaw = String(process.env.TURNSTILE_ENFORCE || '').trim().toLowerCase();
  const enforce = enforceRaw === '1' || enforceRaw === 'true';

  // Disabled
  if (!secret) return { ok: true };

  // Not enforcing and no token provided
  const t = (token || '').trim();
  if (!enforce && !t) return { ok: true };

  if (!t) return { ok: false, errorCodes: ['missing-input-response'] };

  const ip = getClientIp(req.headers) || undefined;

  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', t);
  if (ip) form.set('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      cache: 'no-store',
    });

    const json = (await res.json().catch(() => null)) as any;

    if (!json || typeof json.success !== 'boolean') {
      return { ok: false, errorCodes: ['invalid-json'] };
    }

    const errorCodes =
      Array.isArray(json['error-codes']) ? (json['error-codes'].map(String) as string[]) : null;

    const challengeTs = typeof json['challenge_ts'] === 'string' ? json['challenge_ts'] : null;
    const hostname = typeof json.hostname === 'string' ? json.hostname : null;

    // exactOptionalPropertyTypes: don't include optional keys with undefined
    const out: TurnstileVerifyResult = {
      ok: Boolean(json.success),
      ...(errorCodes ? { errorCodes } : {}),
      ...(challengeTs ? { challengeTs } : {}),
      ...(hostname ? { hostname } : {}),
    };

    return out;
  } catch {
    // If enforce, fail closed; otherwise fail open
    if (enforce) return { ok: false, errorCodes: ['network-error'] };
    return { ok: true };
  }
}
