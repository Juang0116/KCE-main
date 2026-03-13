// src/app/api/admin/ops/incidents/[id]/resolve/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminCapability } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminCapability(req, 'alerts_ack');
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const { id } = await ctx.params;

  const admin = getSupabaseAdmin() as any;
  const now = new Date().toISOString();

  const res = await admin
    .from('ops_incidents')
    .update({ status: 'resolved', resolved_at: now, updated_at: now })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (res.error) {
    return NextResponse.json(
      { error: res.error.message, requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, id: res.data?.id ?? id, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
