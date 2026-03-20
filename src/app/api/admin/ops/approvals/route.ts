// src/app/api/admin/ops/approvals/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { listOpsApprovals } from '@/lib/opsApprovals.server'; // Aquí vive el tipo OpsApprovalStatus
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Ajustamos el esquema para que coincida con OpsApprovalStatus
// Eliminamos "executed" porque TypeScript dice que no es válido en el servidor.
const QuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'expired']).default('pending'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'DB client not initialized', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      status: searchParams.get('status') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    // 2. Ahora "status" es compatible con OpsApprovalStatus
    const { status, limit } = parsed.data;

    const approvals = await listOpsApprovals(status, limit);

    return NextResponse.json(
      { ok: true, approvals, requestId }, 
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await logEvent('api.error', { 
      requestId, 
      route: '/api/admin/ops/approvals', 
      message: errorMessage 
    });

    return NextResponse.json(
      { ok: false, error: 'Internal server error', requestId }, 
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}