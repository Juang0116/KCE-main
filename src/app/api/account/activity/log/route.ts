// src/app/api/account/activity/log/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { jsonError } from '@/lib/apiErrors';
import { logEvent } from '@/lib/events.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

function safeType(input: unknown): string {
  const raw = typeof input === 'string' ? input : '';
  const s = raw.trim().slice(0, 64);
  // allow: auth.login, account.security.open, etc.
  if (!s || !/^[a-z0-9_.-]+$/i.test(s)) return '';
  return s;
}

function safePayload(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object') return {};
  // best-effort shallow clone + cap size by JSON stringify
  try {
    const o = input as Record<string, unknown>;
    const json = JSON.stringify(o, (_k, v) => (v === undefined ? null : v));
    // cap to ~12KB
    if (json.length > 12_000) return { note: 'payload_too_large' };
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const rl = await checkRateLimit(req, {
    action: 'account.activity.log',
    limit: 120,
    windowSeconds: 300,
    identity: 'vid',
  });
  if (!rl.allowed) {
    void logEvent('api.rate_limited', {
      request_id: requestId,
      route: '/api/account/activity/log',
      action: 'account.activity.log',
      key_base: rl.keyBase,
    });
    return jsonError(req, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Rate limit exceeded',
      requestId,
    });
  }

  const token = bearerToken(req);
  if (!token)
    return jsonError(req, {
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Missing bearer token',
      requestId,
    });

  const admin = getSupabaseAdmin();
  const { data: userRes, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userRes?.user) {
    void logEvent('auth.invalid_token', {
      request_id: requestId,
      route: '/api/account/activity/log',
    });
    return jsonError(req, {
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Invalid session',
      requestId,
    });
  }

  const userId = userRes.user.id;

  const body = (await req.json().catch(() => ({}))) as any;
  const type = safeType(body?.type);
  const payload = safePayload(body?.payload);
  const source = typeof body?.source === 'string' ? body.source.slice(0, 48) : 'client';

  if (!type)
    return jsonError(req, {
      status: 400,
      code: 'INVALID_INPUT',
      message: 'Invalid event type',
      requestId,
    });

  // Use server logger to insert into events (best-effort)
  await logEvent(type, payload, { userId, source });

  return NextResponse.json({ ok: true, requestId }, { status: 200 });
}
