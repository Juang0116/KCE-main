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

const ApplySchema = z
  .object({
    template: z.enum(['kce_default']).default('kce_default'),
    bindActor: z.string().trim().min(1).max(200).optional(),
    bindRole: z.string().trim().min(1).max(64).optional(),
  })
  .strict();

type Role = { role_key: string; name: string; permissions: string[] };

type Template = { key: string; name: string; description: string; roles: Role[] };

const KCE_DEFAULT: Template = {
  key: 'kce_default',
  name: 'KCE Default Roles',
  description: 'Set recomendado de roles y permisos para CRM/OPS/Content/Analytics.',
  roles: [
    { role_key: 'owner', name: 'Owner (full access)', permissions: ['*'] },
    {
      role_key: 'ops_admin',
      name: 'Ops Admin',
      permissions: [
        'admin_access',
        'ops_view',
        'ops_control',
        'audit_view',
        'audit_export',
        'system_view',
        'analytics_view',
      ],
    },
    {
      role_key: 'crm_manager',
      name: 'CRM Manager',
      permissions: [
        'admin_access',
        'crm_view',
        'crm_customers',
        'crm_leads',
        'crm_deals',
        'crm_tickets',
        'crm_conversations',
        'crm_outbound',
        'crm_export',
        'bookings_view',
        'bookings_export',
      ],
    },
    {
      role_key: 'sales_agent',
      name: 'Sales Agent',
      permissions: ['admin_access', 'crm_view', 'crm_leads', 'crm_deals', 'crm_tickets', 'crm_conversations', 'bookings_view'],
    },
    {
      role_key: 'content_editor',
      name: 'Content Editor',
      permissions: ['admin_access', 'content_view', 'content_edit', 'catalog_view'],
    },
    {
      role_key: 'pricing_admin',
      name: 'Pricing Admin',
      permissions: ['admin_access', 'catalog_view', 'catalog_admin', 'pricing_admin'],
    },
    {
      role_key: 'analyst',
      name: 'Analyst (read-only)',
      permissions: ['admin_access', 'analytics_view', 'audit_view', 'ops_view', 'crm_view', 'catalog_view', 'content_view'],
    },
    { role_key: 'reviews_mod', name: 'Reviews Moderator', permissions: ['admin_access', 'reviews_view', 'reviews_moderate'] },
    { role_key: 'rbac_admin', name: 'RBAC Admin', permissions: ['admin_access', 'rbac_admin'] },
  ],
};

const TEMPLATES: Record<string, Template> = {
  [KCE_DEFAULT.key]: KCE_DEFAULT,
};

function json(status: number, body: any, requestId?: string) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(requestId ? withRequestId(undefined, requestId) : {}),
    },
  });
}

async function upsertRole(sb: any, role_key: string, name: string, permissions: string[]) {
  // Prefer new schema (role_key).
  const a = await sb.from('crm_roles').upsert({ role_key, name, permissions }, { onConflict: 'role_key' }).select('*').single();
  if (!a?.error) return a.data;

  // Legacy fallback (key).
  const b = await sb.from('crm_roles').upsert({ key: role_key, name, permissions }, { onConflict: 'key' }).select('*').single();
  if (b?.error) throw new Error(b.error.message);
  return b.data;
}

async function ensureBinding(sb: any, actor: string, role_key: string) {
  // Try upsert (if unique constraint exists)
  const u = await sb
    .from('crm_role_bindings')
    .upsert({ actor, role_key }, { onConflict: 'actor,role_key' })
    .select('*')
    .single();
  if (!u?.error) return u.data;

  // Fallback: check then insert
  const s = await sb.from('crm_role_bindings').select('*').eq('actor', actor).eq('role_key', role_key).maybeSingle();
  if (!s?.error && s.data) return s.data;

  const i = await sb.from('crm_role_bindings').insert({ actor, role_key }).select('*').single();
  if (i?.error) throw new Error(i.error.message);
  return i.data;
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const guard = await requireAdminCapability(req, 'rbac_admin');
  if (!guard.ok) return guard.response;

  const items = Object.values(TEMPLATES).map((t) => ({
    key: t.key,
    name: t.name,
    description: t.description,
    rolesCount: t.roles.length,
  }));

  return json(200, { ok: true, requestId, items }, requestId);
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const guard = await requireAdminCapability(req, 'rbac_admin');
  if (!guard.ok) return guard.response;

  const parsed = ApplySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return json(400, { ok: false, requestId, error: parsed.error.flatten() }, requestId);
  }

  const tpl = TEMPLATES[parsed.data.template];
  if (!tpl) return json(404, { ok: false, requestId, error: 'Template not found' }, requestId);

  const sb = getSupabaseAdmin() as any;
  if (!sb) return json(500, { ok: false, requestId, error: 'Supabase admin no configurado.' }, requestId);

  const actor = parsed.data.bindActor || (await getAdminActor(req)) || null;
  const bindRole = (parsed.data.bindRole || 'owner').trim();

  try {
    const applied = [] as any[];
    for (const r of tpl.roles) {
      const row = await upsertRole(sb, r.role_key, r.name, r.permissions);
      applied.push(row);
    }

    let binding: any = null;
    if (actor) {
      binding = await ensureBinding(sb, actor, bindRole);
    }

    await logEvent(
      'admin.rbac.templates.apply',
      {
        request_id: requestId,
        actor: actor || 'unknown',
        template: tpl.key,
        bindRole,
        bound: Boolean(binding),
      },
      { source: 'admin', dedupeKey: `admin.rbac.templates.apply:${requestId}` },
    );

    return json(200, { ok: true, requestId, template: tpl.key, rolesApplied: tpl.roles.length, binding }, requestId);
  } catch (e: any) {
    return json(500, { ok: false, requestId, error: e?.message || 'Error' }, requestId);
  }
}
