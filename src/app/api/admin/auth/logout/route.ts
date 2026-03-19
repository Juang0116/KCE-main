import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  // Obtenemos el actor antes de borrar las cookies para el log
  const actor = req.cookies.get('admin_actor')?.value || 'unknown';

  const res = NextResponse.json(
    { ok: true, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) }
  );

  const isProd = process.env.NODE_ENV === 'production';
  const clearOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    path: '/',
    maxAge: 0, // Expira la cookie inmediatamente
  };

  // 1. Borramos el Token Secreto
  res.cookies.set('admin_token', '', clearOptions);

  // 2. Borramos la Identidad del Actor
  res.cookies.set('admin_actor', '', clearOptions);

  // 3. Log de Auditoría
  void logEvent('security.logout_success', { actor }, { userId: actor });

  return res;
}