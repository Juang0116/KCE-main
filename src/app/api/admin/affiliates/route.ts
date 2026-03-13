import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  code: z.string().trim().min(2).max(64).regex(/^[a-z0-9][a-z0-9_-]{1,63}$/i),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional(),
  commission_bps: z.number().int().min(0).max(5000).optional(),
});

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'growth.manage');
  if (!auth.ok) return auth.response;

  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Supabase admin not configured' },
      { status: 503, headers: withRequestId(undefined, requestId) },
    );
  }

  const { data, error } = await (sb as any)
    .from('affiliates')
    .select('id, code, name, email, status, commission_bps, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json(
      { ok: false, requestId, error: error.message },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, requestId, items: data ?? [] },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'growth.manage');
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, requestId, error: 'Invalid JSON' },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const parsed = CreateSchema.safeParse(body);
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

  const { data, error } = await (sb as any)
    .from('affiliates')
    .insert({
      code: parsed.data.code.toLowerCase(),
      name: parsed.data.name,
      email: parsed.data.email ?? null,
      commission_bps: parsed.data.commission_bps ?? 1000,
      status: 'active' as const,
    })
    .select('id, code, name, email, status, commission_bps, created_at')
    .single();

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
