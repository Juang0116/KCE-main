import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { serverEnv } from '@/lib/env';
import { signLinkToken } from '@/lib/linkTokens.server';
import { getRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { supabaseServer } from '@/lib/supabase/server';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';

type BookingRow = {
  id: string;
  user_id: string | null;
  customer_email: string | null;
};

/**
 * Resuelve el usuario actual buscando en cookies o en el header Authorization
 */
async function resolveUser(req: NextRequest) {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getUser();
  
  if (!error && data.user) return data.user;

  // Fallback para clientes que no usan cookies (Bearer)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const admin = getSupabaseAdmin();
    const token = authHeader.slice(7).trim();
    const { data: adminData } = await admin.auth.getUser(token);
    return adminData?.user ?? null;
  }

  return null;
}

export async function GET(
  req: NextRequest, 
  ctx: { params: Promise<{ session_id: string }> }
) {
  const requestId = getRequestId(req.headers);
  const { session_id } = await ctx.params;

  const admin = getSupabaseAdmin();
  const user = await resolveUser(req);

  if (!user) {
    return NextResponse.json({ error: 'No autorizado', requestId }, { status: 401 });
  }

  // 1. Verificar propiedad de la reserva
  const { data, error } = await admin
    .from('bookings')
    .select('id, user_id, customer_email')
    .eq('stripe_session_id', session_id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ 
      error: error?.message || 'Reserva no encontrada', 
      requestId 
    }, { status: error ? 500 : 404 });
  }

  const booking = data as BookingRow;
  const userEmail = user.email ?? '';

  // Validación de seguridad: el usuario debe ser el dueño o tener el mismo email
  const isOwner = 
    (booking.user_id === user.id) || 
    (booking.customer_email === userEmail && userEmail !== '');

  if (!isOwner) {
    void logEvent('auth.forbidden_calendar_access', { session_id }, { userId: user.id });
    return NextResponse.json({ error: 'Acceso denegado', requestId }, { status: 403 });
  }

  // 2. Generar Link Token firmado
  if (!serverEnv.LINK_TOKEN_SECRET) {
    return NextResponse.json({ error: 'Configuración incompleta', requestId }, { status: 503 });
  }

  const token = signLinkToken({
    sessionId: session_id,
    secret: serverEnv.LINK_TOKEN_SECRET,
    ttlSeconds: 1800, // 30 minutos
  });

  // 3. Redirección al generador de iCal/Google Calendar
  const calendarApiUrl = new URL(`/api/calendar/${session_id}`, req.url);
  calendarApiUrl.searchParams.set('t', token);

  void logEvent('account.calendar_link_generated', { session_id }, { userId: user.id });

  return NextResponse.redirect(calendarApiUrl, 303);
}