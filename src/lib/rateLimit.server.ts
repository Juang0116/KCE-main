// src/lib/rateLimit.server.ts
import 'server-only';

import { getClientIp, safeId } from '@/lib/net';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

import type { NextRequest } from 'next/server';

export type RateLimitSpec = {
  action: string; // e.g. 'reviews.create'
  limit: number; // max attempts per window
  windowSeconds: number; // window size in seconds
  identity?: 'vid' | 'ip' | 'ip+vid';
  /** When true, if rate limiter can't reach Supabase, the request is allowed. Defaults to true. */
  failOpen?: boolean;
};

/**
 * Database-backed best-effort rate limiting using event_locks.
 * Implementation: reserve one of N "slots" within the time bucket.
 *
 * Pros: works across serverless instances, no extra tables required.
 * Cons: remaining is approximate; window can't be "decremented".
 */
export async function checkRateLimit(
  req: NextRequest,
  spec: RateLimitSpec,
): Promise<{
  allowed: boolean;
  keyBase: string;
  remaining?: number;
  retryAfterSeconds?: number;
  slotUsed?: number;
}> {
  // Local dev: avoid blocking ourselves due to React Strict Mode + hot reload (can double-fire requests).
  if (process.env.NODE_ENV !== 'production') {
    const ip = safeId(getClientIp(req.headers));
    const vid = safeId(req.cookies.get('kce_vid')?.value);
    const id = spec.identity === 'ip' ? ip : spec.identity === 'vid' ? vid : `${ip}:${vid}`;
    const now = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(now / Math.max(1, spec.windowSeconds));
    const keyBase = `rl:${spec.action}:${id}:${bucket}`;
    return { allowed: true, keyBase, remaining: spec.limit };
  }

  const admin = getSupabaseAdmin();
  const failOpen = spec.failOpen ?? true;

  // If Supabase admin isn't configured, do NOT block requests.
  if (!admin) {
    const ip = safeId(getClientIp(req.headers));
    const vid = safeId(req.cookies.get('kce_vid')?.value);
    const id = spec.identity === 'ip' ? ip : spec.identity === 'vid' ? vid : `${ip}:${vid}`;
    const now = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(now / Math.max(1, spec.windowSeconds));
    const keyBase = `rl:${spec.action}:${id}:${bucket}`;
    return { allowed: true, keyBase, remaining: spec.limit };
  }

  const vid = safeId(req.cookies.get('kce_vid')?.value);
  const ip = safeId(getClientIp(req.headers));
  const id = spec.identity === 'ip' ? ip : spec.identity === 'vid' ? vid : `${ip}:${vid}`;

  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / Math.max(1, spec.windowSeconds));
  const keyBase = `rl:${spec.action}:${id}:${bucket}`;

  // Best-effort cleanup (ignore if schema doesn't support these columns).
  try {
    await (admin as any).from('event_locks').delete().lt('expires_at', new Date().toISOString());
  } catch {
    // ignore
  }
  try {
    const cutoff = new Date(Date.now() - spec.windowSeconds * 1000).toISOString();
    await (admin as any).from('event_locks').delete().lt('created_at', cutoff);
  } catch {
    // ignore
  }

  const pattern = `${keyBase}:%`;
  const maxRetries = 4;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // COUNT existing locks for the current bucket
    let countRes: any;
    try {
      countRes = await (admin as any)
        .from('event_locks')
        .select('key', { count: 'exact', head: true })
        .like('key', pattern)
        .gt('expires_at', new Date().toISOString());
    } catch {
      countRes = await (admin as any)
        .from('event_locks')
        .select('key', { count: 'exact', head: true })
        .like('key', pattern);
    }

    if (countRes.error) {
      if (failOpen) return { allowed: true, keyBase, remaining: spec.limit };
      return { allowed: false, keyBase, remaining: 0, retryAfterSeconds: spec.windowSeconds };
    }

    const used = Number(countRes.count ?? 0) || 0;
    if (used >= spec.limit) {
      return {
        allowed: false,
        keyBase,
        remaining: 0,
        retryAfterSeconds: spec.windowSeconds,
      };
    }

    const slot = used + 1;
    const key = `${keyBase}:${slot}`;

    // Insert must support multiple schemas (some require expires_at/scope/meta).
    const nowIso = new Date().toISOString();
    const expIso = new Date(Date.now() + spec.windowSeconds * 1000).toISOString();

    // IMPORTANT: make `key` mandatory at the type level to satisfy TS
    const attempts: Array<{ key: string } & Record<string, any>> = [
      { key, scope: 'global', acquired_at: nowIso, expires_at: expIso, meta: { action: spec.action } },
      { key, expires_at: expIso },
      { key, created_at: nowIso },
      { key },
    ];

    let ok = false;

    for (const payload of attempts) {
      // CRITICAL FIX: use (admin as any) so Supabase generated types don't reject extra columns
      const r = await (admin as any).from('event_locks').insert(payload).select('key').maybeSingle();
      if (!r?.error && r?.data?.key) {
        ok = true;
        break;
      }

      const msg = String(r?.error?.message || '');
      const schemaMismatch =
        msg.includes('does not exist') ||
        msg.includes('violates not-null constraint') ||
        msg.includes('column') ||
        msg.includes('Unknown');

      // if it's NOT a schema mismatch, don't keep trying other payload shapes
      if (!schemaMismatch) break;
    }

    if (ok) {
      return {
        allowed: true,
        keyBase,
        remaining: Math.max(0, spec.limit - slot),
        slotUsed: slot,
      };
    }

    // Conflict/race: retry a few times.
    if (attempt === maxRetries) {
      return {
        allowed: false,
        keyBase,
        remaining: 0,
        retryAfterSeconds: spec.windowSeconds,
      };
    }
  }

  return { allowed: false, keyBase, remaining: 0, retryAfterSeconds: spec.windowSeconds };
}
