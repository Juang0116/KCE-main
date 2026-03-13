// src/app/api/admin/auth/action-token/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { mintAdminActionToken } from '@/lib/signedActions.server';
import { requireAdminBasicAuth, getAdminActor } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(status: number, body: any, headers?: Record<string, string>) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

export async function GET(req: NextRequest) {
  return withRequestId(req, async () => {
    const rid = getRequestId(req.headers);

    // Defense-in-depth: ensure this endpoint is protected even if middleware config changes.
    const auth = await requireAdminBasicAuth(req);
    if (!auth.ok) return auth.response;

    const actor = (await getAdminActor(req)) || 'admin';

    try {
      // Bind token to the current actor to prevent cross-actor replay.
      const { token, exp } = mintAdminActionToken(actor);
      return json(200, { token, exp });
    } catch {
      return json(500, { error: 'No se pudo generar token de acción.', code: 'ACTION_TOKEN_ERROR', requestId: rid });
    }
  });
}
