// src/app/api/admin/ops/incidents/[id]/postmortem/action-items/sync/route.ts
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

type AdminMutationOk = {
  ok: true;
  actor: string;
};

type AdminMutationFail = {
  ok: false;
  res: NextResponse;
};

async function requireAdminMutation(req: NextRequest): Promise<AdminMutationOk | AdminMutationFail> {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminScope(req);
  if (!auth.ok) return { ok: false, res: auth.response };

  // getAdminActor en tu codebase a veces termina siendo async; lo soportamos.
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

    // IMPORTANTE: tu helper parece aceptar SOLO 1 argumento (token).
    const v = await verifyAndConsumeAdminActionToken(tok);

    if (!v.ok) {
      // required: bloquear; soft: permitir pero loguear
      await logEvent(
        'ops.signed_action.rejected',
        { requestId, actor, code: (v as any).code, message: (v as any).message, route: '/api/admin/ops/incidents/[id]/postmortem/action-items/sync' },
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

type ActionItem = {
  title?: string;
  owner?: string;
  due_at?: string;
  status?: string;
  task_id?: string;
};

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

  const admin = getSupabaseAdmin();
  const sb = admin as any; // <-- workaround: evita "never" mientras arreglas tipos Supabase

  try {
    const pmRes = await sb
      .from('ops_postmortems')
      .select('incident_id, action_items')
      .eq('incident_id', incidentId)
      .maybeSingle();

    if (pmRes?.error) {
      await logEvent('api.error', { requestId, where: 'postmortem.action_items.sync', error: pmRes.error.message }, { source: 'api' });
      return NextResponse.json(
        { ok: false, requestId, error: 'DB error' },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const pm = pmRes?.data;
    if (!pm) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Postmortem not found' },
        { status: 404, headers: withRequestId(undefined, requestId) },
      );
    }

    const items: ActionItem[] = Array.isArray(pm.action_items) ? (pm.action_items as any[]) : [];
    let created = 0;

    const nextItems: ActionItem[] = [];

    for (const raw of items) {
      const it: ActionItem = raw && typeof raw === 'object' ? { ...(raw as any) } : {};
      const title = String(it.title || '').trim();

      // si no hay título o ya está linkeado a task, no crear nada
      if (!title || it.task_id) {
        nextItems.push(it);
        continue;
      }

      const insRes = await sb
        .from('tasks')
        .insert({
          title: `[POSTMORTEM] ${title}`.slice(0, 500),
          status: 'open',
          priority: 'normal',
          assigned_to: it.owner ? String(it.owner).slice(0, 200) : null,
          due_at: it.due_at ? String(it.due_at) : null,
          deal_id: null,
          ticket_id: null,
        })
        .select('id')
        .single();

      if (!insRes?.error && insRes?.data?.id) {
        it.task_id = String(insRes.data.id);
        created += 1;
      }

      nextItems.push(it);
    }

    const upRes = await sb
      .from('ops_postmortems')
      .update({ action_items: nextItems as any })
      .eq('incident_id', incidentId);

    if (upRes?.error) {
      await logEvent('api.error', { requestId, where: 'postmortem.action_items.sync.update', error: upRes.error.message }, { source: 'api' });
      return NextResponse.json(
        { ok: false, requestId, error: 'DB error' },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    await logEvent(
      'ops.postmortem.action_items.synced',
      { requestId, incidentId, created, actor: m.actor },
      { source: 'ops', entityId: incidentId, dedupeKey: `ops:pm:sync:${incidentId}:${requestId}` },
    );

    return NextResponse.json(
      { ok: true, requestId, incidentId, created, action_items: nextItems },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      { requestId, where: 'postmortem.action_items.sync.catch', error: e instanceof Error ? e.message : 'unknown' },
      { source: 'api' },
    );
    return NextResponse.json(
      { ok: false, requestId, error: 'Unexpected error' },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
