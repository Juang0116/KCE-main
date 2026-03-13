import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().optional().nullable(),
  status: z.enum(['active', 'paused', 'closed']).optional(),
  commission_bps: z.number().int().min(0).max(5000).optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'growth.manage');
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, requestId, error: 'Invalid JSON' },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Invalid payload' },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Supabase admin not configured' },
      { status: 503, headers: withRequestId(undefined, requestId) },
    );
  }

  // NOTE: Supabase client typings are currently collapsing to `never` in this repo.
  // Cast the table builder to `any` to unblock updates.
  const { data, error } = await (sb as any)
    .from('affiliates')
    .update(parsed.data)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, requestId, error: error.message },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, requestId, item: data },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'growth.manage');
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Supabase admin not configured' },
      { status: 503, headers: withRequestId(undefined, requestId) },
    );
  }

  const { error } = await (sb as any).from('affiliates').delete().eq('id', id);

  if (error) {
    return NextResponse.json(
      { ok: false, requestId, error: error.message },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
