// src/app/api/admin/ops/incidents/[id]/postmortem/route.ts
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
        { requestId, actor, code: (v as any).code, message: (v as any).message, route: '/api/admin/ops/incidents/[id]/postmortem' },
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

const BodySchema = z
  .object({
    owner: z.string().trim().max(120).optional(),
    summary: z.string().trim().max(8000).optional(),
    customer_impact: z.string().trim().max(8000).optional(),
    root_cause: z.string().trim().max(8000).optional(),
    timeline: z.string().trim().max(12000).optional(),
    what_went_well: z.string().trim().max(8000).optional(),
    what_went_wrong: z.string().trim().max(8000).optional(),
    action_items: z.array(z.any()).optional(),
  })
  .strict();

function safeStr(v: unknown, max: number): string {
  const s = typeof v === 'string' ? v : '';
  return s.trim().slice(0, max);
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
    .from('ops_postmortems')
    .select('*')
    .eq('incident_id', incidentId)
    .maybeSingle();

  if (error) {
    await logEvent('api.error', { requestId, route: '/api/admin/ops/incidents/[id]/postmortem', message: error.message }, { source: 'api' });
    return NextResponse.json(
      { ok: false, requestId, error: error.message },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, requestId, postmortem: data ?? null },
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

  const raw = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const admin = getSupabaseAdmin();
  const sb = admin as any; // <-- workaround "never"

  const body = parsed.data;

  const patch = {
    incident_id: incidentId,
    owner: safeStr(body.owner || m.actor || 'admin', 120),
    summary: safeStr(body.summary || '', 8000),
    customer_impact: safeStr(body.customer_impact || '', 8000),
    root_cause: safeStr(body.root_cause || '', 8000),
    timeline: safeStr(body.timeline || '', 12000),
    what_went_well: safeStr(body.what_went_well || '', 8000),
    what_went_wrong: safeStr(body.what_went_wrong || '', 8000),
    action_items: Array.isArray(body.action_items) ? body.action_items : [],
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from('ops_postmortems')
    .upsert(patch, { onConflict: 'incident_id' })
    .select('*')
    .maybeSingle();

  if (error) {
    await logEvent('api.error', { requestId, route: '/api/admin/ops/incidents/[id]/postmortem', message: error.message }, { source: 'api' });
    return NextResponse.json(
      { ok: false, requestId, error: error.message },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  await logEvent(
    'ops.postmortem.upserted',
    { requestId, incidentId, actor: m.actor },
    { source: 'ops', entityId: incidentId, dedupeKey: `ops:pm:upsert:${incidentId}:${requestId}` },
  );

  return NextResponse.json(
    { ok: true, requestId, postmortem: data ?? null },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
