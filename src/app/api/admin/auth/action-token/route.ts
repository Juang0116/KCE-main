import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { mintAdminActionToken } from '@/lib/signedActions.server';
import { requireAdminBasicAuth, getAdminActor } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  return withRequestId(req, async () => {
    // 1. Verificación de Seguridad (Basic Auth)
    // Asegura que solo un admin con credenciales válidas pida un token de acción
    const auth = await requireAdminBasicAuth(req);
    if (!auth.ok) return auth.response;

    // 2. Identificación del Actor
    // Intentamos obtener el ID real, si no, usamos 'system_admin' como fallback
    const actor = (await getAdminActor(req)) || 'system_admin';

    try {
      // 3. Generación del Token Firmado
      // El token queda vinculado al actor para evitar que se use en nombre de otro
      const { token, exp } = mintAdminActionToken(actor);

      // Auditamos la generación del token (Seguridad)
      void logEvent(
        'admin.action_token_minted', 
        { actor, expires_at: new Date(exp * 1000).toISOString() }, 
        { userId: auth.ok ? (auth as any).actor ?? null : null }
      );

      return NextResponse.json(
        { ok: true, token, exp, requestId },
        { status: 200, headers: withRequestId(undefined, requestId) }
      );

    } catch (err: any) {
      console.error('[ACTION_TOKEN_ERROR]', err);
      
      return NextResponse.json(
        { 
          ok: false, 
          error: 'No se pudo generar token de acción.', 
          code: 'ACTION_TOKEN_ERROR', 
          requestId 
        }, 
        { status: 500 }
      );
    }
  });
}