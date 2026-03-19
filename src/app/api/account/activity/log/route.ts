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
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.toLowerCase().startsWith('bearer ')) return null;
  return authHeader.split(' ')[1]?.trim() || null;
}

function safeType(input: unknown): string {
  const s = (typeof input === 'string' ? input : '').trim().slice(0, 64);
  return /^[a-z0-9_.-]+$/i.test(s) ? s : '';
}

function safePayload(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object') return {};
  try {
    const json = JSON.stringify(input, (_k, v) => (v === undefined ? null : v));
    if (json.length > 12_000) return { _error: 'payload_exceeds_limit' };
    return JSON.parse(json);
  } catch {
    return { _error: 'invalid_json_structure' };
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  // 1. Control de flujo (Rate Limit)
  const rl = await checkRateLimit(req, {
    action: 'account.activity.log',
    limit: 120,
    windowSeconds: 300,
    identity: 'vid',
  });

  if (!rl.allowed) {
    // Aquí también pasamos el requestId dentro del objeto meta
    void logEvent('api.rate_limited', { requestId, route: req.nextUrl.pathname });
    return jsonError(req, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Demasiadas solicitudes. Intenta más tarde.',
      requestId,
    });
  }

  // 2. Autenticación
  const token = bearerToken(req);
  if (!token) {
    return jsonError(req, {
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Sesión no válida',
      requestId,
    });
  }

  const admin = getSupabaseAdmin();
  const { data: { user }, error: authError } = await admin.auth.getUser(token);

  if (authError || !user) {
    void logEvent('auth.invalid_log_attempt', { request_id: requestId });
    return jsonError(req, {
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Sesión expirada',
      requestId,
    });
  }

  // 3. Procesamiento de datos
  const body = await req.json().catch(() => ({}));
  const type = safeType(body.type);
  const payload = safePayload(body.payload);
  const source = (typeof body.source === 'string' ? body.source : 'client').slice(0, 48);

  if (!type) {
    return jsonError(req, {
      status: 400,
      code: 'INVALID_INPUT',
      message: 'Tipo de evento no válido',
      requestId,
    });
  }

  // 4. Registro persistente
  try {
    // CORRECCIÓN: requestId se envía dentro del payload (2do argumento)
    // para que se guarde en la columna 'meta' de la base de datos.
    await logEvent(
      type, 
      { ...payload, request_id: requestId }, 
      { userId: user.id, source }
    );
  } catch (err) {
    console.error(`[Log-Error] ${requestId}:`, err);
  }

  return NextResponse.json({ ok: true, requestId }, { status: 200 });
}