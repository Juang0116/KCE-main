// src/app/api/admin/rbac/templates/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability, getAdminActor } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ApplySchema = z.object({
  template: z.enum(['kce_default']).default('kce_default'),
  bindActor: z.string().trim().min(1).max(200).optional(),
  bindRole: z.string().trim().min(1).max(64).default('owner'),
}).strict();

interface RoleTemplate {
  role_key: string;
  name: string;
  permissions: string[];
}

interface TemplateConfig {
  key: string;
  name: string;
  description: string;
  roles: RoleTemplate[];
}

// --- Definición del Ecosistema KCE ---
const KCE_DEFAULT: TemplateConfig = {
  key: 'kce_default',
  name: 'KCE Default Roles',
  description: 'Estructura recomendada para CRM, OPS, Contenido y Analytics.',
  roles: [
    { role_key: 'owner', name: 'Propietario (Acceso Total)', permissions: ['*'] },
    { 
      role_key: 'ops_admin', 
      name: 'Administrador de Operaciones', 
      permissions: ['admin_access', 'ops_view', 'ops_control', 'system_view', 'analytics_view'] 
    },
    { 
      role_key: 'crm_manager', 
      name: 'Gerente de CRM', 
      permissions: ['admin_access', 'crm_view', 'crm_leads', 'crm_deals', 'crm_tickets', 'crm_outbound', 'bookings_view'] 
    },
    { 
      role_key: 'content_editor', 
      name: 'Editor de Contenido', 
      permissions: ['admin_access', 'content_view', 'content_edit', 'catalog_view'] 
    },
    { 
      role_key: 'analyst', 
      name: 'Analista de Datos', 
      permissions: ['admin_access', 'analytics_view', 'audit_view', 'crm_view'] 
    },
    { 
      role_key: 'rbac_admin', 
      name: 'Administrador de Seguridad', 
      permissions: ['admin_access', 'rbac_admin'] 
    },
  ],
};

const TEMPLATES: Record<string, TemplateConfig> = {
  [KCE_DEFAULT.key]: KCE_DEFAULT,
};

/**
 * Gestiona el guardado de roles soportando esquemas legacy.
 */
async function upsertRole(db: any, role_key: string, name: string, permissions: string[]) {
  const resModern = await db.from('crm_roles')
    .upsert({ role_key, name, permissions }, { onConflict: 'role_key' })
    .select('*').maybeSingle();

  if (!resModern.error) return resModern.data;

  const resLegacy = await db.from('crm_roles')
    .upsert({ key: role_key, name, permissions }, { onConflict: 'key' })
    .select('*').maybeSingle();

  if (resLegacy.error) throw resLegacy.error;
  return resLegacy.data;
}

/**
 * Asegura la vinculación de un usuario a un rol.
 */
async function ensureBinding(db: any, actor: string, role_key: string) {
  const { data, error } = await db.from('crm_role_bindings')
    .upsert({ actor, role_key }, { onConflict: 'actor,role_key' })
    .select('*').maybeSingle();

  if (error) throw error;
  return data;
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'rbac_admin');
  if (!auth.ok) return auth.response;

  const items = Object.values(TEMPLATES).map(t => ({
    key: t.key,
    name: t.name,
    description: t.description,
    rolesCount: t.roles.length,
  }));

  return NextResponse.json({ ok: true, requestId, items }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'rbac_admin');
  if (!auth.ok) return auth.response;

  try {
    const json = await req.json().catch(() => ({}));
    const parsed = ApplySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Datos inválidos', details: parsed.error.flatten(), requestId }, { status: 400 });
    }

    const { template: tplKey, bindActor, bindRole } = parsed.data;
    
    // --- EL FIX: Verificación de existencia de la plantilla ---
    const tpl = TEMPLATES[tplKey];
    if (!tpl) {
      return NextResponse.json(
        { ok: false, error: `La plantilla '${tplKey}' no existe en la configuración.`, requestId },
        { status: 404 }
      );
    }
    // A partir de aquí, TS ya sabe que 'tpl' no es undefined.

    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('DB Admin no disponible');

    const db = admin as any;
    const appliedRoles = [];

    // 1. Aplicar todos los roles del template
    for (const r of tpl.roles) {
      const row = await upsertRole(db, r.role_key, r.name, r.permissions);
      appliedRoles.push(row);
    }

    // 2. Realizar vinculación opcional
    const actorToBind = bindActor || (await getAdminActor(req)) || null;
    let binding = null;
    
    if (actorToBind) {
      binding = await ensureBinding(db, actorToBind, bindRole);
    }

    // 3. Auditoría
    await logEvent('rbac.template_applied', {
      requestId,
      template: tplKey,
      actor: actorToBind,
      roleBound: bindRole,
      rolesCount: appliedRoles.length
    });

    return NextResponse.json({
      ok: true,
      requestId,
      template: tpl.key,
      applied: appliedRoles.length,
      binding
    }, { status: 200, headers: withRequestId(undefined, requestId) });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al aplicar plantilla';
    await logEvent('api.error', { requestId, route: 'rbac.templates', error: msg });

    return NextResponse.json({ ok: false, error: 'Fallo al procesar la plantilla de roles', requestId }, { status: 500 });
  }
}