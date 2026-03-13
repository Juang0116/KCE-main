// src/app/api/account/activity/route.ts
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

type ActivityItem = {
  id: string;
  type: string;
  source: string | null;
  entity_id: string | null;
  created_at: string | null;
  payload: unknown;
};

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const rl = await checkRateLimit(req, {
    action: 'account.activity.get',
    limit: 60,
    windowSeconds: 300,
    identity: 'vid',
  });
  if (!rl.allowed) {
    void logEvent('api.rate_limited', {
      request_id: requestId,
      route: '/api/account/activity',
      action: 'account.activity.get',
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
    void logEvent('auth.invalid_token', { request_id: requestId, route: '/api/account/activity' });
    return jsonError(req, {
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Invalid session',
      requestId,
    });
  }

  const userId = userRes.user.id;

  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get('limit') || '50');
  const limit = Math.max(1, Math.min(50, Number.isFinite(limitRaw) ? limitRaw : 50));

  const { data, error } = await admin
    .from('events')
    .select('id,type,source,entity_id,created_at,payload')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    void logEvent(
      'api.error',
      {
        request_id: requestId,
        route: '/api/account/activity',
        message: error.message,
        code: error.code,
      },
      { userId },
    );
    return jsonError(req, {
      status: 500,
      code: 'INTERNAL',
      message: 'Failed to load activity',
      requestId,
    });
  }

  const items: ActivityItem[] = (data || []).map((row: any) => ({
    id: String(row.id),
    type: String(row.type || ''),
    source: row.source ?? null,
    entity_id: row.entity_id ?? null,
    created_at: row.created_at ?? null,
    payload: row.payload ?? null,
  }));

  return NextResponse.json({ ok: true, requestId, items }, { status: 200 });
}
