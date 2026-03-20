// src/app/api/admin/rbac/bindings/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability, getAdminActor } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  actor: z.string().trim().min(1, "El actor es obligatorio").max(200),
  role_key: z.string().trim().min(1, "El rol es obligatorio").max(120),
}).strict();

/**
 * Lista todas las asignaciones de roles (Bindings) activas.
 */
export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'rbac_admin');
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'DB Admin no disponible', requestId }, { status: 503 });
  }

  try {
    const { data, error } = await (admin as any)
      .from('crm_role_bindings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      { ok: true, requestId, items: data ?? [] },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );
  } catch (error: any) {
    await logEvent('api.error', { requestId, route: 'rbac.bindings.list', message: error.message });
    return NextResponse.json({ ok: false, requestId, error: 'Error al listar roles' }, { status: 500 });
  }
}

/**
 * Crea una nueva vinculación de rol para un actor.
 */
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'rbac_admin');
  if (!auth.ok) return auth.response;

  const admin_actor = await getAdminActor(req).catch(() => 'system');

  try {
    const json = await req.json().catch(() => ({}));
    const parsed = CreateSchema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json({ ok: false, requestId, error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { actor, role_key } = parsed.data;

    const { data, error } = await (admin as any)
      .from('crm_role_bindings')
      .insert({ actor, role_key })
      .select('*')
      .single();

    if (error) throw error;

    // Auditoría crítica: Quién otorgó el rol y a quién
    await logEvent('rbac.binding_created', {
      requestId,
      granted_to: actor,
      role: role_key,
      granted_by: admin_actor
    });

    return NextResponse.json({ ok: true, requestId, item: data }, { status: 201 });

  } catch (error: any) {
    await logEvent('api.error', { requestId, route: 'rbac.bindings.create', message: error.message });
    return NextResponse.json({ ok: false, requestId, error: 'No se pudo asignar el rol' }, { status: 500 });
  }
}

/**
 * Revoca un rol (borra el binding).
 */
export async function DELETE(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'rbac_admin');
  if (!auth.ok) return auth.response;

  const admin_actor = await getAdminActor(req).catch(() => 'system');
  const url = new URL(req.url);
  const actor = url.searchParams.get('actor')?.trim();
  const role_key = url.searchParams.get('role_key')?.trim();

  if (!actor || !role_key) {
    return NextResponse.json({ ok: false, error: 'actor y role_key son requeridos', requestId }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await (admin as any)
      .from('crm_role_bindings')
      .delete()
      .eq('actor', actor)
      .eq('role_key', role_key);

    if (error) throw error;

    // Auditoría crítica: Quién revocó el rol
    await logEvent('rbac.binding_deleted', {
      requestId,
      revoked_from: actor,
      role: role_key,
      revoked_by: admin_actor
    });

    return NextResponse.json({ ok: true, requestId }, { status: 200 });

  } catch (error: any) {
    await logEvent('api.error', { requestId, route: 'rbac.bindings.delete', message: error.message });
    return NextResponse.json({ ok: false, requestId, error: 'Error al revocar el rol' }, { status: 500 });
  }
}