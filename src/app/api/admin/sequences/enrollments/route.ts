// src/app/api/admin/sequences/enrollments/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { listActiveEnrollments } from '@/lib/sequences.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const limit = Math.min(
    Number(new URL(req.url).searchParams.get('limit') ?? '50'),
    200,
  );

  const items = await listActiveEnrollments(limit);

  return NextResponse.json(
    { ok: true, items, total: items.length, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
