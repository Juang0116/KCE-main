import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope } from '@/lib/adminAuth';
import { markOutboundLost } from '@/lib/outbound.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const { id } = await ctx.params;

  try {
    const body = await req.json().catch(() => ({}));
    const note = typeof body?.note === 'string' ? body.note : null;
    const upd = await markOutboundLost(id, note);
    return NextResponse.json({ ok: true, item: upd, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || 'Failed to mark lost'), requestId }, { status: 500, headers: withRequestId(undefined, requestId) });
  }
}
