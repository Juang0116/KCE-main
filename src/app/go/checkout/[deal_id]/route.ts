import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { serverEnv } from '@/lib/env';
import { logEvent } from '@/lib/events.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { verifyLinkToken } from '@/lib/linkTokens.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Helper para respuestas de error en texto plano, 
 * evitando fugas de información innecesarias en el cliente.
 */
function textResponse(status: number, message: string) {
  return new NextResponse(message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deal_id: string }> },
) {
  // 1. Resolver params de forma asíncrona (Next.js 15 standard)
  const resolvedParams = await params;
  const dealId = (resolvedParams.deal_id || '').trim();
  
  if (!dealId) return textResponse(400, 'Missing deal id');

  // 2. Extraer token de seguridad 't' de la URL
  const token = (req.nextUrl.searchParams.get('t') || '').trim();
  if (!token) {
    return textResponse(
      403,
      'Acceso denegado. Por favor, utiliza el enlace seguro proporcionado por soporte de KCE.',
    );
  }

  // 3. Consultar el "Deal" en Supabase con cliente Admin
  const supabase = getSupabaseAdmin();
  const { data: deal, error } = await supabase
    .from('deals')
    .select('id, checkout_url, stripe_session_id, stage')
    .eq('id', dealId)
    .maybeSingle();

  if (error) {
    console.error('[Checkout Redirect Error]:', error);
    return textResponse(500, 'Error interno al cargar la transacción.');
  }
  
  if (!deal) return textResponse(404, 'La transacción no existe o ha caducado.');

  const checkoutUrl = (deal.checkout_url || '').trim();
  const sid = (deal.stripe_session_id || '').trim();

  if (!checkoutUrl || !sid) {
    return textResponse(404, 'Enlace de pago no disponible. Solicita uno nuevo a soporte.');
  }

  // 4. Verificar firma del token contra el Session ID de Stripe
  const secret = serverEnv.LINK_TOKEN_SECRET;
  if (!secret) return textResponse(500, 'Server misconfiguration (Secret missing)');

  const verified = verifyLinkToken({ token, secret, expectedSessionId: sid });
  
  if (!verified.ok) {
    return textResponse(403, `Token inválido (${verified.reason}). Solicita un nuevo enlace seguro.`);
  }

  // 5. Trackeo del evento (Background task)
  // Usamos 'void' para no bloquear la redirección del usuario
  void logEvent(
    'checkout.opened',
    {
      deal_id: dealId,
      stripe_session_id: sid,
      stage: deal.stage || null,
      ua: req.headers.get('user-agent') || null,
      ref: req.headers.get('referer') || null,
    },
    { 
      source: 'go', 
      entityId: sid, 
      dedupeKey: `checkout.opened:${dealId}:${sid}` 
    },
  );

  // 6. Redirección final al Checkout de Stripe (302 Found)
  return NextResponse.redirect(checkoutUrl, 302);
}