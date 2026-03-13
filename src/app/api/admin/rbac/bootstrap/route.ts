// src/app/api/admin/rbac/bootstrap/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { getAdminActor, requireAdminBasicAuth } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { verifyAndConsumeAdminActionToken } from '@/lib/signedActions.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(status: number, body: any, requestId?: string) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(requestId ? withRequestId(undefined, requestId) : {}),
    },
  });
}

function signedMode() {
  const raw = (process.env.SIGNED_ACTIONS_MODE || '').trim().toLowerCase();
  const hasSecret = String(process.env.SIGNED_ACTIONS_SECRET || '').trim().length > 0;
  const mode: 'off' | 'soft' | 'required' =
    raw === 'off' || raw === 'soft' || raw === 'required'
      ? (raw as any)
      : hasSecret
        ? process.env.NODE_ENV === 'production'
          ? 'required'
          : 'soft'
        : 'off';
  return { mode, hasSecret };
}

async function selectRole(admin: any, roleKey: string) {
  const a = await admin.from('crm_roles').select('*').eq('role_key', roleKey).maybeSingle();
  if (!a?.error) return a.data;

  const b = await admin.from('crm_roles').select('*').eq('key', roleKey).maybeSingle();
  if (b?.error) throw new Error(b.error.message);
  return b.data;
}

async function ensureOwnerRole(admin: any) {
  const exists = await selectRole(admin, 'owner').catch(() => null);
  if (exists) return;

  // Prefer modern schema (role_key). Fallback to legacy (key).
  const ins1 = await admin.from('crm_roles').insert({ role_key: 'owner', name: 'Owner', permissions: ['*'] });
  if (!ins1?.error) return;

  const ins2 = await admin.from('crm_roles').insert({ key: 'owner', name: 'Owner', permissions: ['*'] });
  if (ins2?.error) throw new Error(ins2.error.message);
}

export async function POST(req: NextRequest) {
  return withRequestId(req, async () => {
    const requestId = getRequestId(req.headers);

    const auth = await requireAdminBasicAuth(req);
    if (!auth.ok) return auth.response;

    const secret = (process.env.RBAC_BOOTSTRAP_SECRET || '').trim();
    const provided = (req.headers.get('x-rbac-bootstrap-secret') || '').trim();
    if (!secret || !provided || provided !== secret) {
      return json(401, { ok: false, requestId, error: 'RBAC bootstrap secret inválido.', code: 'BOOTSTRAP_SECRET_INVALID' }, requestId);
    }

    const { mode } = signedMode();
    if (mode !== 'off') {
      const token = (req.headers.get('x-kce-action-token') || req.headers.get('x-admin-action-token') || '').trim();
      if (!token) {
        if (mode === 'required') {
          return json(403, { ok: false, requestId, error: 'Falta token de acción.', code: 'ACTION_TOKEN_REQUIRED' }, requestId);
        }
      } else {
        const ok = await verifyAndConsumeAdminActionToken(token);
        if (!ok.ok && mode === 'required') {
          return json(403, { ok: false, requestId, error: 'Token de acción inválido.', code: ok.code }, requestId);
        }
      }
    }

    const actor = ((await getAdminActor(req)) || 'admin').trim();
    const admin = getSupabaseAdmin() as any;
    if (!admin) return json(500, { ok: false, requestId, error: 'Supabase admin no configurado.' }, requestId);

    await ensureOwnerRole(admin);

    // Ensure binding actor -> owner
    const { data: existing, error: exErr } = await admin
      .from('crm_role_bindings')
      .select('id')
      .eq('actor', actor)
      .eq('role_key', 'owner')
      .limit(1);
    if (exErr) return json(500, { ok: false, requestId, error: exErr.message }, requestId);

    if (!existing || existing.length === 0) {
      const { error: insErr } = await admin
        .from('crm_role_bindings')
        .insert({ actor, role_key: 'owner', created_by: actor });
      if (insErr) return json(500, { ok: false, requestId, error: insErr.message }, requestId);
    }

    void logEvent(
      'rbac_bootstrap',
      { request_id: requestId, actor, role: 'owner' },
      { source: 'admin', dedupeKey: `rbac_bootstrap:${actor}` },
    );

    return json(200, { ok: true, requestId, actor, role: 'owner' }, requestId);
  });
}
