// src/app/api/admin/rbac/roles/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RoleSchema = z.object({
  role_key: z.string().min(2).max(64).regex(/^[a-z0-9_]+$/, 'Use snake_case (a-z0-9_)'),
  name: z.string().min(2).max(120),
  permissions: z.array(z.string().min(1).max(80)).default([]),
});

function json(status: number, body: any) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function normalizeRole(row: any) {
  return {
    role_key: String(row?.role_key || row?.key || '').trim(),
    name: row?.name ?? null,
    permissions: Array.isArray(row?.permissions) ? row.permissions : [],
    created_at: row?.created_at ?? null,
  };
}

async function selectAllRoles(admin: any) {
  // Prefer new schema (role_key). Fallback to legacy (key).
  const a = await admin.from('crm_roles').select('*').order('created_at', { ascending: true });
  if (!a?.error) return (a.data || []).map(normalizeRole);

  const b = await admin.from('crm_roles').select('*').order('created_at', { ascending: true });
  if (b?.error) throw new Error(b.error.message);
  return (b.data || []).map(normalizeRole);
}

async function upsertRole(admin: any, role_key: string, name: string, permissions: string[]) {
  const a = await admin
    .from('crm_roles')
    .upsert({ role_key, name, permissions }, { onConflict: 'role_key' })
    .select('*')
    .single();

  if (!a?.error) return normalizeRole(a.data);

  // Legacy fallback
  const b = await admin
    .from('crm_roles')
    .upsert({ key: role_key, name, permissions }, { onConflict: 'key' })
    .select('*')
    .single();

  if (b?.error) throw new Error(b.error.message);
  return normalizeRole(b.data);
}

export async function GET(req: NextRequest) {
  // withRequestId supports (req, handler). Some routes previously used it as a decorator,
  // which caused `handler is not a function` at runtime.
  return withRequestId(req, async () => {
    const requestId = getRequestId(req);

    const guard = await requireAdminCapability(req, 'rbac_admin');
    if (!guard.ok) return guard.response;

    const sb = getSupabaseAdmin() as any;
    if (!sb) return json(500, { ok: false, error: 'Supabase admin no configurado.' });

    try {
      const roles = await selectAllRoles(sb);
      return json(200, { ok: true, requestId, items: roles });
    } catch (e: any) {
      return json(500, { ok: false, requestId, error: e?.message || 'Error' });
    }
  });
}

export async function POST(req: NextRequest) {
  return withRequestId(req, async () => {
    const requestId = getRequestId(req);

    const guard = await requireAdminCapability(req, 'rbac_admin');
    if (!guard.ok) return guard.response;

    const sb = getSupabaseAdmin() as any;
    if (!sb) return json(500, { ok: false, error: 'Supabase admin no configurado.' });

    const parsed = RoleSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return json(400, { ok: false, requestId, error: parsed.error.flatten() });
    }

    try {
      const role = await upsertRole(sb, parsed.data.role_key, parsed.data.name, parsed.data.permissions);
      return json(200, { ok: true, requestId, item: role });
    } catch (e: any) {
      return json(500, { ok: false, requestId, error: e?.message || 'Error' });
    }
  });
}
