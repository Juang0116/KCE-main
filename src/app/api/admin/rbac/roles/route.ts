// src/app/api/admin/rbac/roles/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability, getAdminActor } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Esquema para validar la creación/actualización de roles.
 * Obliga al uso de snake_case para mantener la consistencia del sistema.
 */
const RoleSchema = z.object({
  role_key: z.string()
    .min(2, "El key es demasiado corto")
    .max(64)
    .regex(/^[a-z0-9_]+$/, 'Usa snake_case (letras minúsculas, números y guiones bajos)'),
  name: z.string().min(2, "El nombre es obligatorio").max(120),
  permissions: z.array(z.string().min(1).max(80)).default([]),
}).strict();

/**
 * Normaliza el objeto de rol para que el cliente siempre vea 'role_key'.
 */
function normalizeRole(row: any) {
  if (!row) return null;
  return {
    role_key: String(row.role_key || row.key || '').trim(),
    name: row.name ?? 'Sin nombre',
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    created_at: row.created_at ?? null,
  };
}

/**
 * Recupera todos los roles manejando fallbacks de esquema.
 */
async function selectAllRoles(admin: any) {
  // Intentamos con el esquema moderno
  const { data, error } = await admin
    .from('crm_roles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    // Si falla (posiblemente por columna inexistente), el error se captura en el catch superior
    throw error;
  }
  
  return (data || []).map(normalizeRole);
}

/**
 * Crea o actualiza un rol manejando el conflicto de nombres de columna.
 */
async function upsertRole(admin: any, role_key: string, name: string, permissions: string[]) {
  // 1. Intentar con esquema moderno (role_key)
  const resModern = await admin
    .from('crm_roles')
    .upsert({ role_key, name, permissions }, { onConflict: 'role_key' })
    .select('*')
    .maybeSingle();

  if (!resModern.error) return normalizeRole(resModern.data);

  // 2. Fallback a esquema legacy (key) si el error indica que la columna no existe
  const resLegacy = await admin
    .from('crm_roles')
    .upsert({ key: role_key, name, permissions }, { onConflict: 'key' })
    .select('*')
    .maybeSingle();

  if (resLegacy.error) throw resLegacy.error;
  return normalizeRole(resLegacy.data);
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  // Seguridad: Solo administradores con capacidad de gestión rbac
  const guard = await requireAdminCapability(req, 'rbac_admin');
  if (!guard.ok) return guard.response;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'DB Admin unavailable', requestId }, { status: 503 });
  }

  try {
    const roles = await selectAllRoles(admin);
    return NextResponse.json(
      { ok: true, requestId, items: roles },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );
  } catch (error: any) {
    await logEvent('api.error', { requestId, route: 'rbac.roles.list', message: error.message });
    return NextResponse.json(
      { ok: false, requestId, error: 'Fallo al recuperar los roles del sistema' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const guard = await requireAdminCapability(req, 'rbac_admin');
  if (!guard.ok) return guard.response;

  const actor = (await getAdminActor(req) || 'admin').trim();
  const admin = getSupabaseAdmin();

  try {
    const json = await req.json().catch(() => ({}));
    const parsed = RoleSchema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Datos de rol inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const role = await upsertRole(
      admin, 
      parsed.data.role_key, 
      parsed.data.name, 
      parsed.data.permissions
    );

    // Auditoría: Registrar quién cambió la definición del rol
    await logEvent('rbac.role_upserted', {
      requestId,
      role: parsed.data.role_key,
      actor,
      permissionsCount: parsed.data.permissions.length
    });

    return NextResponse.json(
      { ok: true, requestId, item: role },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );
  } catch (error: any) {
    await logEvent('api.error', { requestId, route: 'rbac.roles.upsert', message: error.message });
    return NextResponse.json(
      { ok: false, requestId, error: 'No se pudo guardar la configuración del rol' },
      { status: 500 }
    );
  }
}