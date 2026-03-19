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

/**
 * Extrae la primera imagen válida de una estructura de datos flexible.
 */
function firstImageUrl(images: any): string | null {
  if (!images) return null;
  if (Array.isArray(images)) {
    const first = images[0];
    if (typeof first === 'string') return first;
    return first?.url || first?.src || null;
  }
  if (typeof images === 'object') {
    return images.url || images.src || null;
  }
  return null;
}

type BookingItem = {
  id: string;
  status: string | null;
  date: string | null;
  persons: number | null;
  total: number | null;
  currency: string | null;
  stripe_session_id: string | null;
  created_at: string | null;
  tour: {
    id: string;
    title: string | null;
    slug: string | null;
    city: string | null;
    cover_image: string | null;
  } | null;
};

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  // 1. Rate Limit: 30 consultas por ventana (más estricto para proteger joins pesados)
  const rl = await checkRateLimit(req, {
    action: 'account.bookings.get',
    limit: 30,
    windowSeconds: 300,
    identity: 'vid',
  });

  if (!rl.allowed) {
    void logEvent('api.rate_limited', { request_id: requestId, route: req.nextUrl.pathname });
    return jsonError(req, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Demasiadas consultas de reservas.',
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
  const { data: userRes, error: userErr } = await admin.auth.getUser(token);

  if (userErr || !userRes?.user) {
    return jsonError(req, {
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Usuario no identificado',
      requestId,
    });
  }

  const userId = userRes.user.id;

  // 3. Consulta Relacional (Join entre Bookings y Tours)
  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      status,
      date,
      persons,
      total,
      currency,
      stripe_session_id,
      created_at,
      tours:tour_id (id, title, slug, city, images)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    void logEvent('api.error', {
      request_id: requestId,
      error_message: error.message,
      error_code: error.code
    }, { userId });

    return jsonError(req, {
      status: 500,
      code: 'INTERNAL',
      message: 'No pudimos cargar tus reservas.',
      requestId,
    });
  }

  // 4. Mapeo para el Frontend
  const items: BookingItem[] = (data || []).map((row: any) => ({
    id: String(row.id),
    status: row.status,
    date: row.date,
    persons: row.persons,
    total: row.total,
    currency: row.currency,
    stripe_session_id: row.stripe_session_id,
    created_at: row.created_at,
    tour: row.tours ? {
      id: String(row.tours.id),
      title: row.tours.title,
      slug: row.tours.slug,
      city: row.tours.city,
      cover_image: firstImageUrl(row.tours.images),
    } : null,
  }));

  // Log de auditoría
  void logEvent('account.bookings_viewed', { 
    request_id: requestId, 
    count: items.length 
  }, { userId });

  return NextResponse.json(
    { items }, 
    { headers: { 'x-request-id': requestId } }
  );
}