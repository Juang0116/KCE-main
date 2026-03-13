import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope } from '@/lib/adminAuth';
import { updateOutboundStatus } from '@/lib/outbound.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const { id } = await ctx.params;

  try {
    const upd = await updateOutboundStatus(id, { status: 'sent', sent_at: new Date().toISOString(), error: null });
    return NextResponse.json({ ok: true, item: upd, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || 'Failed to mark sent'), requestId }, { status: 500, headers: withRequestId(undefined, requestId) });
  }
}
