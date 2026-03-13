import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope } from '@/lib/adminAuth';
import { listOpsApprovals } from '@/lib/opsApprovals.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const status = (url.searchParams.get('status') || 'pending') as any;
  const limit = Number(url.searchParams.get('limit') || '50');

  try {
    const approvals = await listOpsApprovals(status, Number.isFinite(limit) ? limit : 50);
    return NextResponse.json({ ok: true, approvals, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e), requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
