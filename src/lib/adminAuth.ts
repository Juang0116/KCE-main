// src/lib/adminAuth.ts
import 'server-only';

import { headers } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

import { checkRateLimit } from '@/lib/rateLimit.server';
import { logEvent } from '@/lib/events.server';
import { logAdminAuditEvent } from '@/lib/adminAudit.server';
import { logSecurityEvent } from '@/lib/securityEvents.server';
import { verifyAndConsumeAdminActionToken } from '@/lib/signedActions.server';

// ✅ FIX: no asumimos nombres exactos en rbac.server
import * as RBAC from '@/lib/rbac.server';

export type Capability = string;

export type AdminAuthResult =
  | { ok: true; mode: 'dev-open' | 'basic' | 'token' }
  | { ok: false; response: NextResponse };

type AccessLike = {
  mode?: string;
  actor?: string;
  roles?: string[];
  permissions?: string[];
  hasAll?: boolean;
  breakglassActive?: boolean;
};

function unauthorized() {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="KCE Admin"' },
  });
}

function isTruthyEnv(value: string | null | undefined): boolean {
  const v = String(value || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function isLocalDevHost(host: string | null | undefined): boolean {
  const value = String(host || '').trim().toLowerCase();
  if (!value) return false;
  const bare = value.split(':')[0] || '';
  return bare === 'localhost' || bare === '127.0.0.1';
}

async function canUseAdminDevOpen(req?: NextRequest): Promise<boolean> {
  if (process.env.NODE_ENV === 'production') return false;
  if (!isTruthyEnv(process.env.ADMIN_DEV_OPEN || '')) return false;

  const host = req ? req.headers.get('host') : (await headers()).get('host');
  return isLocalDevHost(host);
}

function decodeBasicNode(authHeader: string): { user: string; pass: string } | null {
  if (!authHeader?.startsWith('Basic ')) return null;
  const b64 = authHeader.slice(6).trim();
  if (!b64) return null;

  try {
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    if (idx < 0) return null;
    return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

/**
 * BasicAuth para /admin y /api/admin.
 * - DEV: si ADMIN_BASIC_USER/PASS no existen → deja pasar (dev-open)
 * - PROD: si faltan credenciales → 503
 * - Si hay credenciales y no coincide → 401
 */
export async function requireAdminBasicAuth(req?: NextRequest): Promise<AdminAuthResult> {
  const ADMIN_TOKEN = (process.env.ADMIN_TOKEN || '').trim();
  const BASIC_USER = (process.env.ADMIN_BASIC_USER || '').trim();
  const BASIC_PASS = (process.env.ADMIN_BASIC_PASS || '').trim();

  const hasToken = Boolean(ADMIN_TOKEN);
  const hasBasic = Boolean(BASIC_USER && BASIC_PASS);

  // Local-only explicit dev-open. Never allow implicit preview/staging bypass.
  if (!hasToken && !hasBasic && (await canUseAdminDevOpen(req))) {
    return { ok: true, mode: 'dev-open' };
  }

  // PROD: require at least one auth method configured.
  if (process.env.NODE_ENV === 'production' && !hasToken && !hasBasic) {
    return { ok: false, response: new NextResponse('Admin auth not configured (ADMIN_TOKEN or ADMIN_BASIC_USER/PASS).', { status: 503 }) };
  }

  // Preferred: cookie-based admin token (aligned with middleware + /admin/login).
  if (hasToken && req) {
    const cookieToken = (req.cookies.get('admin_token')?.value || '').trim();
    const headerToken = (req.headers.get('x-admin-token') || '').trim();
    if (cookieToken && cookieToken === ADMIN_TOKEN) {
      return { ok: true, mode: 'token' };
    }
    if (headerToken && headerToken === ADMIN_TOKEN) {
      return { ok: true, mode: 'token' };
    }
  }

  // Fallback: Basic Auth.
  if (hasBasic) {
    const h = req ? req.headers : await headers();
    const authHeader = h.get('authorization') || '';

    const parsed = decodeBasicNode(authHeader);
    if (!parsed) return { ok: false, response: unauthorized() };
    if (parsed.user !== BASIC_USER || parsed.pass !== BASIC_PASS) return { ok: false, response: unauthorized() };

    return { ok: true, mode: 'basic' };
  }

  // If we only have token auth configured and it didn't match.
  return { ok: false, response: new NextResponse('Unauthorized', { status: 401 }) };
}

export async function getAdminActor(req?: NextRequest): Promise<string> {
  // 1) If Basic Auth is present, it wins.
  const h = req ? req.headers : await headers();
  const authHeader = h.get('authorization') || '';
  const parsed = decodeBasicNode(authHeader);
  if (parsed?.user) return String(parsed.user).trim();

  // 2) Cookie-based session (set by /api/admin/auth/login).
  if (req) {
    const actor = (req.cookies.get('admin_actor')?.value || '').trim();
    if (actor) return actor;
  }

  // 3) Fallback to configured admin user (or "admin").
  return (process.env.ADMIN_USER || 'admin').trim();
}

function forbidden(code?: string, extra?: Record<string, any>) {
  return new NextResponse(
    JSON.stringify({ ok: false, error: 'Forbidden', code: code || 'FORBIDDEN', ...(extra || {}) }),
    { status: 403, headers: { 'content-type': 'application/json; charset=utf-8' } },
  );
}

/** ✅ Wrapper: obtener acceso (compat con nombres distintos en rbac.server) */
async function getEffectiveAccessCompat(actor: string): Promise<AccessLike> {
  const anyRBAC = RBAC as any;

  // intenta varios nombres comunes
  const fn =
    anyRBAC.getEffectiveAccess ||
    anyRBAC.getAccess ||
    anyRBAC.getAdminAccess ||
    anyRBAC.computeEffectiveAccess ||
    anyRBAC.resolveAccess;

  if (typeof fn === 'function') {
    const res = await fn(actor);
    return (res ?? {}) as AccessLike;
  }

  // fallback ultra-seguro: sin permisos
  return { mode: 'rbac', actor, roles: [], permissions: [], hasAll: false, breakglassActive: false };
}

/** ✅ Wrapper: validar breakglass (compat) */
async function validateBreakglassTokenCompat(actor: string, token: string): Promise<boolean> {
  const anyRBAC = RBAC as any;
  const fn =
    anyRBAC.validateBreakglassToken ||
    anyRBAC.verifyBreakglassToken ||
    anyRBAC.consumeBreakglassToken ||
    anyRBAC.checkBreakglassToken;

  if (typeof fn === 'function') {
    const res = await fn(actor, token);
    return Boolean(res);
  }
  return false;
}

/** ✅ Wrapper: chequeo de capability (compat + fallback) */
function hasCapabilityCompat(access: AccessLike, cap: Capability): boolean {
  const anyRBAC = RBAC as any;

  // si existe helper oficial, úsalo
  const fn = anyRBAC.hasCapability || anyRBAC.can || anyRBAC.hasPermission;
  if (typeof fn === 'function') {
    try {
      return Boolean(fn(access, cap));
    } catch {
      // cae al fallback
    }
  }

  const norm = (v: string) => String(v || '').trim().toLowerCase().replace(/\./g, '_').replace(/-/g, '_');

  // fallback: hasAll o permissions incluye '*'/cap (con compat '.' <-> '_')
  if (access?.hasAll) return true;
  const perms = new Set((access?.permissions ?? []).map((p) => norm(String(p))));

  const need = norm(String(cap));
  if (!need) return false;
  if (perms.has('*')) return true;
  if (perms.has(need)) return true;

  const alt = need.includes('_') ? need.replace(/_/g, '.') : need.replace(/\./g, '_');
  if (alt && perms.has(norm(alt))) return true;

  return false;
}

export async function requireAdminCapability(req: NextRequest, cap: Capability) {
  const auth = await requireAdminBasicAuth(req);
  if (!auth.ok) return auth;

  const actor = (await getAdminActor(req)) || 'admin';

  const guard = await enforceAdminMutationGuards(req, actor);
  if (guard) return { ok: false as const, response: guard };

  // Breakglass override
  const breakglass = (req.headers.get('x-breakglass-token') || '').trim();
  if (breakglass) {
    const ok = await validateBreakglassTokenCompat(actor, breakglass);
    if (ok) {
      return {
        ok: true as const,
        mode: auth.mode,
        actor,
        access: {
          mode: 'rbac',
          actor,
          roles: ['breakglass'],
          permissions: ['*'],
          hasAll: true,
          breakglassActive: true,
        } satisfies AccessLike,
      };
    }
  }

  const access = await getEffectiveAccessCompat(actor);

  const RBAC_REQUIRED = ['1','true','yes','on'].includes(String(process.env.RBAC_REQUIRED || '').trim().toLowerCase());
  if (!RBAC_REQUIRED) {
    if (!hasCapabilityCompat(access, cap)) {
      return { ok: false as const, response: forbidden('RBAC_DISABLED_NO_SCOPE', { actor, capability: cap }) };
    }
  }
  if (RBAC_REQUIRED && !(access?.roles?.length) && !access?.hasAll) {
    return { ok: false, response: forbidden('RBAC_REQUIRED', { actor }) };
  }
  if (!hasCapabilityCompat(access, cap)) return { ok: false as const, response: forbidden() };

  // Best-effort audit for admin mutations
  const method = req.method.toUpperCase();
  const isMut = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (isMut) {
    void logAdminAuditEvent(req, {
      actor,
      action: 'admin.mutation',
      method,
      path: req.nextUrl.pathname,
      capability: cap,
      meta: { roles: access.roles ?? [], breakglass: Boolean(access.breakglassActive) },
    });
  }

  return { ok: true as const, mode: auth.mode, actor, access };
}


/**
 * ✅ P3: RBAC granular por "scope" (auto)
 * Deducción automática de capability basada en pathname + método.
 * - Mantiene compatibilidad: si no puede inferir, exige 'admin_access'.
 */
export async function requireAdminScope(req: NextRequest, overrideCap?: Capability | { cap?: string } | null) {
  const info = inferAdminCapabilityInfo(req);

  // Defensive: some callers may accidentally pass objects. We normalize to a string.
  const overrideRaw =
    typeof overrideCap === 'string'
      ? overrideCap
      : overrideCap && typeof (overrideCap as any).cap === 'string'
        ? String((overrideCap as any).cap)
        : '';

  const cap = String(overrideRaw || info.cap || '').trim();

  const RBAC_REQUIRED = ['1', 'true', 'yes', 'on'].includes(
    String(process.env.RBAC_REQUIRED || '').trim().toLowerCase(),
  );

  // P4: deny-by-default when we cannot confidently infer a scope and RBAC is enforced.
  // We still allow wildcard owners (permissions = '*') to operate while we add new areas/scopes.
  if (!overrideCap && info.isFallback && RBAC_REQUIRED) {
    const base = await requireAdminCapability(req, 'admin_access');
    if (!base.ok) return base;

    if (!base.access?.hasAll) {
      return {
        ok: false as const,
        response: forbidden('SCOPE_UNKNOWN', {
          area: info.area,
          path: req.nextUrl.pathname,
          method: req.method,
        }),
      };
    }
    // owner: continue
  }

  return requireAdminCapability(req, (cap || 'admin_access') as Capability);
}

function inferAdminCapabilityInfo(req: NextRequest): { cap: Capability; area: string; isFallback: boolean } {
  const path = req.nextUrl.pathname || '';
  const method = req.method.toUpperCase();
  const isMut = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  // Normaliza: /api/admin/<area>/...
  const parts = path.split('/').filter(Boolean);
  const idx = parts.indexOf('admin');
  const area = idx >= 0 ? (parts[idx + 1] || '') : '';
  const rest = idx >= 0 ? parts.slice(idx + 2).join('/') : parts.join('/');

  const has = (s: string) => rest.includes(s);

  const knownAreas = new Set([
    '',
    'rbac',
    'system',
    'analytics',
    'audit',
    'ops',
    'runbook',
    'events',
    'tasks',
    'catalog',
    'content',
    'reviews',
    'bookings',
    'sales',
    'outbound',
    'sequences',
    'segments',
    'templates',
    'tickets',
    'conversations',
    'customers',
    'leads',
    'deals',
    'metrics',
    'revenue',
    'qa',
    'ai',
  ]);

  if (!knownAreas.has(area)) {
    return { cap: isMut ? 'admin_write' : 'admin_access', area, isFallback: true };
  }

  if (area === '') {
    return { cap: isMut ? 'admin_write' : 'admin_access', area, isFallback: false };
  }

  if (area === 'rbac') return { cap: 'rbac_admin', area, isFallback: false };

  if (area === 'system') return { cap: isMut ? 'system_admin' : 'system_view', area, isFallback: false };

  if (area === 'analytics') return { cap: 'analytics_view', area, isFallback: false };

  if (area === 'metrics') return { cap: 'analytics_view', area, isFallback: false };

  if (area === 'revenue') return { cap: isMut ? 'ops_control' : 'analytics_view', area, isFallback: false };

  if (area === 'qa') return { cap: isMut ? 'ops_control' : 'ops_view', area, isFallback: false };

  if (area === 'ai') return { cap: isMut ? 'system_admin' : 'system_view', area, isFallback: false };

  if (area === 'audit') {
    if (has('export')) return { cap: 'audit_export', area, isFallback: false };
    return { cap: isMut ? 'audit_admin' : 'audit_view', area, isFallback: false };
  }

  if (area === 'ops' || area === 'runbook' || area === 'events' || area === 'tasks') {
    if (has('cron') || has('backup') || has('breakglass') || has('incident') || has('approvals')) {
      return { cap: 'ops_control', area, isFallback: false };
    }
    return { cap: isMut ? 'ops_control' : 'ops_view', area, isFallback: false };
  }

  if (area === 'catalog') {
    if (has('pricing-rules')) return { cap: 'pricing_admin', area, isFallback: false };
    return { cap: isMut ? 'catalog_admin' : 'catalog_view', area, isFallback: false };
  }

  if (area === 'content') return { cap: isMut ? 'content_edit' : 'content_view', area, isFallback: false };

  if (area === 'reviews') return { cap: isMut ? 'reviews_moderate' : 'reviews_view', area, isFallback: false };

  if (area === 'bookings') {
    if (has('export')) return { cap: 'bookings_export', area, isFallback: false };
    if (has('ops')) return { cap: 'bookings_ops', area, isFallback: false };
    return { cap: isMut ? 'bookings_ops' : 'bookings_view', area, isFallback: false };
  }

  if (area === 'sales' || area === 'outbound' || area === 'sequences' || area === 'segments' || area === 'templates') {
    if (has('export')) return { cap: 'crm_export', area, isFallback: false };
    return { cap: isMut ? 'crm_outbound' : 'crm_view', area, isFallback: false };
  }

  if (area === 'tickets') return { cap: isMut ? 'crm_tickets' : 'crm_view', area, isFallback: false };
  if (area === 'conversations') return { cap: isMut ? 'crm_conversations' : 'crm_view', area, isFallback: false };

  if (area === 'customers') {
    if (has('export')) return { cap: 'crm_export', area, isFallback: false };
    return { cap: isMut ? 'crm_customers' : 'crm_view', area, isFallback: false };
  }

  if (area === 'leads') return { cap: isMut ? 'crm_leads' : 'crm_view', area, isFallback: false };

  if (area === 'deals') {
    if (has('export')) return { cap: 'crm_export', area, isFallback: false };
    return { cap: isMut ? 'crm_deals' : 'crm_view', area, isFallback: false };
  }

  return { cap: isMut ? 'admin_write' : 'admin_access', area, isFallback: false };
}

function tooManyRequests(retryAfterSeconds?: number) {
  const s = Math.max(1, Math.floor(retryAfterSeconds ?? 60));
  return new NextResponse(
    JSON.stringify({ error: 'Demasiadas solicitudes.', code: 'RATE_LIMIT', retryAfterSeconds: s }),
    {
      status: 429,
      headers: { 'content-type': 'application/json; charset=utf-8', 'Retry-After': String(s) },
    },
  );
}

async function enforceAdminMutationGuards(req: NextRequest, actor: string): Promise<NextResponse | null> {
  const method = req.method.toUpperCase();
  const isMut = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (!isMut) return null;

  const path = req.nextUrl.pathname;
  const isAuth = path.includes('/api/admin/auth/');
  const rl = await checkRateLimit(req, {
    action: isAuth ? 'admin.auth' : 'admin.mutate',
    limit: isAuth ? 30 : 240,
    windowSeconds: 60,
    identity: 'ip+vid',
    failOpen: true,
  });

  if (!rl.allowed) {
    void logSecurityEvent(req, {
      severity: 'warn',
      kind: 'rate_limit',
      actor,
      meta: { scope: isAuth ? 'admin.auth' : 'admin.mutate', keyBase: rl.keyBase },
    });
    return tooManyRequests(rl.retryAfterSeconds);
  }

  // Signed actions mode:
  // - Explicit SIGNED_ACTIONS_MODE wins.
  // - If secret is configured but mode is unset, default to soft in dev and required in prod.
  const rawMode = (process.env.SIGNED_ACTIONS_MODE || '').trim().toLowerCase();
  const hasSecret = String(process.env.SIGNED_ACTIONS_SECRET || '').trim().length > 0;
  const mode: 'off' | 'soft' | 'required' =
    rawMode === 'off' || rawMode === 'soft' || rawMode === 'required'
      ? (rawMode as any)
      : hasSecret
        ? (process.env.NODE_ENV === 'production' ? 'required' : 'soft')
        : 'off';
  if (mode === 'off') return null;

  const token = (req.headers.get('x-kce-action-token') || '').trim();
  if (!token) {
    if (mode === 'required') {
      void logSecurityEvent(req, { severity: 'warn', kind: 'signed_action_missing', actor, meta: { path } });
      return new NextResponse(JSON.stringify({ error: 'Falta token de acción.', code: 'ACTION_TOKEN_REQUIRED' }), {
        status: 403,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
    return null;
  }

  const ok = await verifyAndConsumeAdminActionToken(token);
  if (!ok.ok) {
    const fatal = ok.code !== 'NONCE_STORE_FAILED';
    if (mode === 'soft' && !fatal) return null;

    void logSecurityEvent(req, {
      severity: fatal ? 'critical' : 'warn',
      kind: 'signed_action_invalid',
      actor,
      meta: { code: ok.code, path },
    });

    return new NextResponse(JSON.stringify({ error: 'Token de acción inválido.', code: ok.code }), {
      status: 403,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  // Bind signed action token to the current actor (defense-in-depth).
  if (ok.payload.actor !== actor) {
    void logSecurityEvent(req, {
      severity: 'warn',
      kind: 'signed_action_actor_mismatch',
      actor,
      meta: { tokenActor: ok.payload.actor, path },
    });

    if (mode === 'required') {
      return new NextResponse(JSON.stringify({ error: 'Token de acción inválido.', code: 'ACTOR_MISMATCH' }), {
        status: 403,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
    // soft mode: allow but alert
  }

  void logEvent(
    'admin.action',
    { method, path: req.nextUrl.pathname, actor, nonce: ok.payload.nonce, exp: ok.payload.exp },
    { source: 'admin', dedupeKey: `admin.action:${ok.payload.nonce}` },
  );

  return null;
}
