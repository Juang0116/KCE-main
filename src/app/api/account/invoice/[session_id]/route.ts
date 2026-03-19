import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { serverEnv } from '@/lib/env';
import { json } from '@/lib/http.server'; // Asumiendo que tu helper maneja (body, status, rid)
import { signLinkToken } from '@/lib/linkTokens.server';
import { getRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { supabaseServer } from '@/lib/supabase/server';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ session_id: string }> };

type BookingRow = {
  id: string;
  user_id: string | null;
  customer_email: string | null;
  stripe_session_id: string | null;
};

/**
 * Resuelve el usuario actual priorizando cookies (para nuevas pestañas) 
 * y con fallback a Bearer token.
 */
async function resolveUser(req: NextRequest) {
  // 1) Sesión basada en Cookies (Ideal para descargas en nueva pestaña)
  try {
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (user) return user;
  } catch { /* ignore */ }

  // 2) Bearer token (Para llamadas desde el estado de la SPA)
  const auth = req.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    const admin = getSupabaseAdmin();
    const token = auth.slice(7).trim();
    if (token) {
      const { data: { user } } = await admin.auth.getUser(token);
      return user;
    }
  }

  return null;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();
  const { session_id } = await ctx.params;

  if (!admin || !serverEnv.LINK_TOKEN_SECRET) {
    return json({ error: 'Configuración de servidor incompleta' }, 503, requestId);
  }

  const user = await resolveUser(req);
  if (!user) return json({ error: 'No autorizado' }, 401, requestId);

  // 1. Verificar la reserva en la base de datos
  const { data, error: bookingErr } = await admin
    .from('bookings')
    .select('id, user_id, customer_email, stripe_session_id')
    .eq('stripe_session_id', session_id)
    .maybeSingle();

  if (bookingErr) return json({ error: 'Error al consultar la reserva' }, 500, requestId);
  
  const booking = data as BookingRow | null;
  if (!booking) return json({ error: 'Reserva no encontrada' }, 404, requestId);

  // 2. Lógica de Autorización (Dueño o mismo Email)
  const userEmail = (user.email || '').toLowerCase();
  const bookingEmail = (booking.customer_email || '').toLowerCase();

  const ownsBooking = 
    (booking.user_id === user.id) || 
    (booking.user_id === null && userEmail === bookingEmail && userEmail !== '');

  if (!ownsBooking) {
    void logEvent('auth.forbidden_invoice_access', { session_id }, { userId: user.id });
    return json({ error: 'Acceso denegado a esta factura' }, 403, requestId);
  }

  // 3. Firmar token de acceso temporal para el PDF
  const t = signLinkToken({
    sessionId: session_id,
    secret: serverEnv.LINK_TOKEN_SECRET,
    ttlSeconds: 1800, // 30 minutos
  });

  // 4. Construir URL de redirección al generador de PDF real
  const url = new URL(`/api/invoice/${session_id}`, req.url);
  const requestedDownload = new URL(req.url).searchParams.get('download');
  const forceDownload = ['1', 'true', 'yes'].includes(requestedDownload || '');

  url.searchParams.set('t', t);
  url.searchParams.set('download', forceDownload ? '1' : '0');

  void logEvent('account.invoice_link_generated', { session_id }, { userId: user.id });

  // 303 See Other: Ideal para redirecciones de GET que llevan a un recurso temporal
  return NextResponse.redirect(url, 303);
}