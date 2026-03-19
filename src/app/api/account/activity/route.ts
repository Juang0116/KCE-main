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

  // 1. Rate Limit (60 consultas cada 5 min por identidad)
  const rl = await checkRateLimit(req, {
    action: 'account.activity.get',
    limit: 60,
    windowSeconds: 300,
    identity: 'vid',
  });

  if (!rl.allowed) {
    void logEvent('api.rate_limited', { 
      request_id: requestId, 
      route: req.nextUrl.pathname 
    });
    return jsonError(req, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Demasiadas solicitudes. Por favor, espera un momento.',
      requestId,
    });
  }

  // 2. Validación de Sesión
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
    return jsonError(req, {
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Sesión expirada o inválida',
      requestId,
    });
  }

  // 3. Parámetros de Paginación Sencilla
  const { searchParams } = new URL(req.url);
  const limitRaw = parseInt(searchParams.get('limit') || '50', 10);
  const limit = Math.max(1, Math.min(100, isNaN(limitRaw) ? 50 : limitRaw));

  // 4. Consulta a la tabla de eventos
  const { data, error } = await admin
    .from('events')
    .select('id, type, source, entity_id, created_at, payload')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    void logEvent('api.error', {
      request_id: requestId,
      error_message: error.message,
      error_code: error.code,
    }, { userId: user.id });

    return jsonError(req, {
      status: 500,
      code: 'INTERNAL', // <--- CAMBIADO: 'INTERNAL_ERROR' por 'INTERNAL'
      message: 'No pudimos cargar tu actividad en este momento.',
      requestId,
    });
  }

  // 5. Mapeo de seguridad para el cliente
  const items: ActivityItem[] = (data || []).map((row) => ({
    id: String(row.id),
    type: String(row.type || 'unknown'),
    source: row.source,
    entity_id: row.entity_id,
    created_at: row.created_at,
    payload: row.payload,
  }));

  return NextResponse.json({ 
    ok: true, 
    requestId, 
    items 
  }, { status: 200 });
}