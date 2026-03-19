import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  // --- SOLUCIÓN DEFINITIVA ERROR 2339 ---
  // Forzamos el cast a 'any' para que TS no se queje de la propiedad .ip
  const ip = (req as any).ip || req.headers.get('x-forwarded-for') || '127.0.0.1';

  const ADMIN_USER = (process.env.ADMIN_USER || '').trim();
  const ADMIN_PASS = (process.env.ADMIN_PASS || '').trim();
  const ADMIN_TOKEN = (process.env.ADMIN_TOKEN || '').trim();

  // 1. Rate Limiting
  const rl = await checkRateLimit(req, {
    action: 'admin.login',
    limit: 10,
    windowSeconds: 15 * 60,
    identity: 'ip',
  });

  if (!rl.allowed) {
    void logEvent('security.login_rate_limited', { ip, requestId });
    return NextResponse.json(
      { ok: false, error: 'Demasiados intentos.', requestId },
      { 
        status: 429, 
        headers: withRequestId({ 'Retry-After': String(rl.retryAfterSeconds ?? 60) }, requestId) 
      }
    );
  }

  // 2. Verificación de Configuración
  if (!ADMIN_TOKEN || !ADMIN_USER || !ADMIN_PASS) {
    return NextResponse.json({ error: 'Configuración de servidor incompleta.' }, { status: 503 });
  }

  // 3. Extracción de Credenciales
  const payload = await req.json().catch(() => ({}));
  const user = String(payload?.user || '').trim();
  const pass = String(payload?.pass || '').trim();

  // 4. Comparación Segura
  const safeEqual = (a: string, b: string) => {
    if (a.length !== b.length) return false;
    let out = 0;
    for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return out === 0;
  };

  if (!safeEqual(user, ADMIN_USER) || !safeEqual(pass, ADMIN_PASS)) {
    void logEvent('security.login_failed', { attempted_user: user, ip });
    return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
  }

  // 5. Login Exitoso y Cookies
  const res = NextResponse.json(
    { ok: true, user, requestId }, 
    { status: 200, headers: withRequestId(undefined, requestId) }
  );

  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 12, // 12 horas
  };

  res.cookies.set('admin_token', ADMIN_TOKEN, cookieOptions);
  res.cookies.set('admin_actor', user, cookieOptions);

  void logEvent('security.login_success', { user, ip }, { userId: user });

  return res;
}