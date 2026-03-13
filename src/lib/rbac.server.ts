// src/lib/rbac.server.ts
import 'server-only';

import crypto from 'node:crypto';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export type EffectiveAccess = {
  mode: 'rbac';
  actor: string;
  roles: string[];
  permissions: string[];
  hasAll: boolean;
};

type RoleRow = {
  role_key?: string | null;
  key?: string | null; // legacy schema
  name?: string | null;
  permissions?: any;
};

type BindingRow = {
  actor?: string | null;
  role_key?: string | null;
  role?: string | null; // legacy (if ever)
  created_at?: string | null;
};

function normalizeKey(s: string) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\./g, '_')
    .replace(/-/g, '_');
}

function coercePermissions(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
  try {
    const parsed = typeof v === 'string' ? JSON.parse(v) : v;
    if (Array.isArray(parsed)) return parsed.map((x) => String(x)).filter(Boolean);
  } catch {
    // ignore
  }
  return [];
}

async function selectRoles(admin: any, roleKeys: string[]): Promise<RoleRow[]> {
  if (!roleKeys.length) return [];

  // Prefer new schema: role_key
  const byRoleKey = await admin.from('crm_roles').select('*').in('role_key', roleKeys);
  if (!byRoleKey?.error) return (byRoleKey.data || []) as RoleRow[];

  // Fallback legacy schema: key
  const byKey = await admin.from('crm_roles').select('*').in('key', roleKeys);
  if (byKey?.error) throw new Error(byKey.error.message);
  return (byKey.data || []) as RoleRow[];
}

export async function getEffectiveAccess(actor: string): Promise<EffectiveAccess> {
  const admin = getSupabaseAdmin() as any;
  if (!admin) return { mode: 'rbac', actor, roles: [], permissions: [], hasAll: false };

  const bindRes = await admin.from('crm_role_bindings').select('*').eq('actor', actor);
  if (bindRes?.error) {
    // Fail closed
    return { mode: 'rbac', actor, roles: [], permissions: [], hasAll: false };
  }

  const bindings = (bindRes.data || []) as BindingRow[];
  const roleKeys = Array.from(
    new Set(bindings.map((b) => String(b.role_key || b.role || '').trim()).filter(Boolean)),
  );

  const roleRows = await selectRoles(admin, roleKeys).catch(() => [] as RoleRow[]);

  const roles = new Set<string>();
  const permissions = new Set<string>();

  for (const rr of roleRows) {
    const rk = String(rr.role_key || rr.key || '').trim();
    if (!rk) continue;
    roles.add(rk);
    for (const p of coercePermissions(rr.permissions)) {
      const norm = normalizeKey(p);
      if (norm) permissions.add(norm);
    }
  }

  const hasAll = permissions.has('*');

  return {
    mode: 'rbac',
    actor,
    roles: Array.from(roles),
    permissions: Array.from(permissions),
    hasAll,
  };
}

export function hasCapability(access: EffectiveAccess, capability: string): boolean {
  if (!access) return false;
  if (access.hasAll) return true;

  const need = normalizeKey(capability);
  if (!need) return false;

  const perms = new Set(access.permissions.map(normalizeKey));
  if (perms.has(need)) return true;

  // Compatibility: rbac.admin <-> rbac_admin
  const alt = need.includes('_') ? need.replace(/_/g, '.') : need.replace(/\./g, '_');
  if (alt && perms.has(normalizeKey(alt))) return true;

  return false;
}

// ----- Breakglass tokens stored in Supabase (crm_breakglass_tokens) -----
function sha256Hex(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export async function validateBreakglassToken(actor: string, token: string): Promise<boolean> {
  const admin = getSupabaseAdmin() as any;
  if (!admin) return false;

  const t = String(token || '').trim();
  if (!t) return false;

  const token_hash = sha256Hex(t);
  const nowIso = new Date().toISOString();

  const { data, error } = await admin
    .from('crm_breakglass_tokens')
    .select('token_hash,actor,expires_at,used_at')
    .eq('token_hash', token_hash)
    .eq('actor', actor)
    .gt('expires_at', nowIso)
    .is('used_at', null)
    .maybeSingle();

  if (error || !data?.token_hash) return false;

  const { error: updErr } = await admin
    .from('crm_breakglass_tokens')
    .update({ used_at: nowIso })
    .eq('token_hash', token_hash)
    .eq('actor', actor)
    .is('used_at', null);

  return !updErr;
}

// Back-compat: some code may import issueBreakglassToken from here.
export async function issueBreakglassToken(input: {
  actor: string;
  ttlMinutes: number;
  reason?: string;
  createdBy?: string;
}) {
  const admin = getSupabaseAdmin() as any;
  if (!admin) throw new Error('Supabase admin not configured');

  const raw = crypto.randomBytes(24);
  const token = raw
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  const token_hash = sha256Hex(token);
  const expires_at = new Date(Date.now() + Math.max(5, input.ttlMinutes) * 60_000).toISOString();

  const { error } = await admin.from('crm_breakglass_tokens').insert({
    token_hash,
    actor: input.actor,
    reason: input.reason || null,
    created_by: input.createdBy || null,
    expires_at,
  });

  if (error) throw new Error(error.message);

  return { token, token_hash, actor: input.actor, expires_at };
}
