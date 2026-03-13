// src/app/api/admin/rbac/bindings/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateSchema = z
  .object({
    actor: z.string().trim().min(1).max(200),
    role_key: z.string().trim().min(1).max(120),
  })
  .strict();

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminCapability(req, 'rbac_admin');
  if (!auth.ok) return auth.response;

  const sb = getSupabaseAdmin();

  const { data, error } = await (sb as any)
    .from('crm_role_bindings')
    .select('*')
    .order('created_at', { ascending: false });

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

  const auth = await requireAdminCapability(req, 'rbac_admin');
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const sb = getSupabaseAdmin();

  const { data, error } = await (sb as any)
    .from('crm_role_bindings')
    .insert({ actor: parsed.data.actor, role_key: parsed.data.role_key })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, requestId, error: error.message },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, requestId, item: data },
    { status: 201, headers: withRequestId(undefined, requestId) },
  );
}

export async function DELETE(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminCapability(req, 'rbac_admin');
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const actor = String(url.searchParams.get('actor') || '').trim();
  const role_key = String(url.searchParams.get('role_key') || '').trim();

  if (!actor || !role_key) {
    return NextResponse.json(
      { ok: false, requestId, error: 'actor and role_key required' },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const sb = getSupabaseAdmin();

  const { error } = await (sb as any)
    .from('crm_role_bindings')
    .delete()
    .eq('actor', actor)
    .eq('role_key', role_key);

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
