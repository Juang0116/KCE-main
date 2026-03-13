// src/app/api/admin/auth/login/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId } from '@/lib/requestId';

function json(status: number, body: any, headers?: Record<string, string>) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(headers || {}) },
  });
}

export async function POST(req: NextRequest) {
  const ADMIN_USER = (process.env.ADMIN_USER || '').trim();
  const ADMIN_PASS = (process.env.ADMIN_PASS || '').trim();
  const ADMIN_TOKEN = (process.env.ADMIN_TOKEN || '').trim();

  const requestId = getRequestId(req.headers);

  const rl = await checkRateLimit(req, {
    action: 'admin.login',
    limit: 10,
    windowSeconds: 15 * 60,
    identity: 'ip',
  });
  if (!rl.allowed) {
    return json(429, { ok: false, error: 'RATE_LIMITED', requestId }, {
      'retry-after': String(rl.retryAfterSeconds ?? 60),
    });
  }


  if (!ADMIN_TOKEN) {
    return json(503, { error: 'Admin token not configured (ADMIN_TOKEN).' });
  }

  if (!ADMIN_USER || !ADMIN_PASS) {
    return json(503, { error: 'Admin credentials not configured (ADMIN_USER/ADMIN_PASS).' });
  }

  let payload: any = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }

  const user = String(payload?.user || '').trim();
  const pass = String(payload?.pass || '').trim();

  // Constant-time compare (best-effort)
  const safeEqual = (a: string, b: string) => {
    if (a.length !== b.length) return false;
    let out = 0;
    for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return out === 0;
  };

  const okUser = safeEqual(user || '', ADMIN_USER);
  const okPass = safeEqual(pass || '', ADMIN_PASS);

  if (!(okUser && okPass)) {
    return json(401, { error: 'Credenciales inválidas.' });
  }

  const res = json(200, { ok: true });

  // HttpOnly cookie: admin_token (scoped to /admin + /api/admin)
  const secure = process.env.NODE_ENV === 'production';
  res.cookies.set('admin_token', ADMIN_TOKEN, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 12, // 12h
  });

  // Actor cookie (for RBAC/audit identity; not a secret)
  res.cookies.set('admin_actor', user, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 12, // 12h
  });


  return res;
}
