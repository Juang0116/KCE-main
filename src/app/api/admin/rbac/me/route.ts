import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminCapability, getAdminActor } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getEffectiveAccess } from '@/lib/rbac.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const guard = await requireAdminCapability(req, 'admin_access');
  if (!guard.ok) return guard.response;

  const actor = (await getAdminActor(req)) || 'admin';
  const access = await getEffectiveAccess(actor);

  return NextResponse.json(
    {
      ok: true,
      requestId,
      actor: access.actor,
      roles: access.roles,
      permissions: access.permissions,
      hasAll: access.hasAll,
    },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
