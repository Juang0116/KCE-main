// src/app/api/admin/reviews/[id]/approve/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  try {
    const auth = await requireAdminScope(req, 'reviews_moderate');
    if (!auth.ok) return auth.response;

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json(
        { error: 'Supabase admin not configured', requestId },
        { status: 503, headers: withRequestId(undefined, requestId) },
      );
    }

    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json(
        { error: 'Missing id', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await (sb as any)
      .from('reviews')
      .update({ status: 'approved', approved: true, published_at: now })
      .eq('id', id)
      .select('id,status,approved,published_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message, requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    return NextResponse.json(
      { ok: true, item: data, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Unhandled error approving review', detail: String(err?.message ?? err), requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
