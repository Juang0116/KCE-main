// src/app/api/admin/ops/incidents/[id]/updates/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope, getAdminActor } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { verifyAndConsumeAdminActionToken } from '@/lib/signedActions.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });

function effectiveSignedMode(): 'off' | 'soft' | 'required' {
  const mode = (process.env.SIGNED_ACTIONS_MODE || '').trim();
  if (mode === 'off' || mode === 'soft' || mode === 'required') return mode;
  return process.env.NODE_ENV === 'production' ? 'required' : 'soft';
}

type AdminMutationOk = { ok: true; actor: string };
type AdminMutationFail = { ok: false; res: NextResponse };

async function requireAdminMutation(req: NextRequest): Promise<AdminMutationOk | AdminMutationFail> {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminScope(req);
  if (!auth.ok) return { ok: false, res: auth.response };

  const actorRaw = await Promise.resolve(getAdminActor(req) as any).catch(() => null);
  const actor = (typeof actorRaw === 'string' && actorRaw.trim()) ? actorRaw.trim() : 'admin';

  const mode = effectiveSignedMode();
  if (mode !== 'off') {
    const tok = (req.headers.get('x-admin-action-token') || '').trim();

    if (!tok) {
      if (mode === 'required') {
        return {
          ok: false,
          res: NextResponse.json(
            { ok: false, requestId, error: 'Missing x-admin-action-token' },
            { status: 401, headers: withRequestId(undefined, requestId) },
          ),
        };
      }
      // soft: permitir sin token
      return { ok: true, actor };
    }

    const v = await verifyAndConsumeAdminActionToken(tok);
    if (!v.ok) {
      await logEvent(
        'ops.signed_action.rejected',
        {
          requestId,
          actor,
          code: (v as any).code,
          message: (v as any).message,
          route: '/api/admin/ops/incidents/[id]/updates',
        },
        { source: 'ops' },
      );

      if (mode === 'required') {
        return {
          ok: false,
          res: NextResponse.json(
            { ok: false, requestId, error: (v as any).message || 'Invalid action token', code: (v as any).code },
            { status: 401, headers: withRequestId(undefined, requestId) },
          ),
        };
      }
      // soft: continuar
    }
  }

  return { ok: true, actor };
}

function safeStr(v: unknown, max = 4000): string {
  const s = typeof v === 'string' ? v : '';
  return s.trim().slice(0, max);
}

function safeObj(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  return v as Record<string, unknown>;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const params = ParamsSchema.safeParse(await ctx.params);
  if (!params.success) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Invalid params', details: params.error.flatten() },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const incidentId = params.data.id;

  const admin = getSupabaseAdmin();
  const sb = admin as any; // <-- workaround "never"

  const { data, error } = await sb
    .from('ops_incident_updates')
    .select('*')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/ops/incidents/[id]/updates', message: error.message },
      { source: 'api' },
    );
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

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);

  const m = await requireAdminMutation(req);
  if (!m.ok) return m.res;

  const params = ParamsSchema.safeParse(await ctx.params);
  if (!params.success) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Invalid params', details: params.error.flatten() },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const incidentId = params.data.id;

  const body = (await req.json().catch(() => ({}))) as any;

  const kind = safeStr(body?.kind ?? 'note', 32) || 'note';
  const message = safeStr(body?.message ?? '', 4000);
  const meta = safeObj(body?.meta);

  if (!message) {
    return NextResponse.json(
      { ok: false, requestId, error: 'message required' },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  if (!['note', 'action', 'status'].includes(kind)) {
    return NextResponse.json(
      { ok: false, requestId, error: 'invalid kind' },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const admin = getSupabaseAdmin();
  const sb = admin as any; // <-- workaround "never"

  const payload = {
    incident_id: incidentId,
    kind,
    actor: m.actor,
    message,
    meta,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from('ops_incident_updates')
    .insert(payload)
    .select('*')
    .maybeSingle();

  if (error) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/ops/incidents/[id]/updates', message: error.message },
      { source: 'api' },
    );
    return NextResponse.json(
      { ok: false, requestId, error: error.message },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, requestId, item: data ?? null },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
