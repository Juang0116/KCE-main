// src/app/api/admin/ops/incidents/[id]/postmortem/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope, getAdminActor } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { verifyAndConsumeAdminActionToken } from '@/lib/signedActions.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({ id: z.string().uuid() });

/**
 * Determina el nivel de seguridad requerido para modificar el análisis.
 */
function effectiveSignedMode(): 'off' | 'soft' | 'required' {
  const mode = (process.env.SIGNED_ACTIONS_MODE || '').trim();
  if (mode === 'off' || mode === 'soft' || mode === 'required') return mode;
  return process.env.NODE_ENV === 'production' ? 'required' : 'soft';
}

/**
 * Valida identidad y firma de acción para mutaciones de postmortem.
 */
async function requireAdminMutation(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return { ok: false, res: auth.response };

  const actorRaw = await Promise.resolve(getAdminActor(req)).catch(() => 'admin');
  const actor = typeof actorRaw === 'string' ? actorRaw.trim() : 'admin';

  const mode = effectiveSignedMode();
  if (mode === 'off') return { ok: true, actor };

  const token = (req.headers.get('x-admin-action-token') || '').trim();
  if (!token) {
    if (mode === 'required') {
      return {
        ok: false,
        res: NextResponse.json({ ok: false, error: 'Se requiere firma de acción', requestId }, { status: 401 }),
      };
    }
    return { ok: true, actor };
  }

  const v = await verifyAndConsumeAdminActionToken(token);
  if (!v.ok) {
    await logEvent('ops.signed_action.rejected', { requestId, actor, route: 'postmortem-upsert' });
    if (mode === 'required') {
      return {
        ok: false,
        res: NextResponse.json({ ok: false, error: v.message, code: v.code, requestId }, { status: 401 }),
      };
    }
  }

  return { ok: true, actor };
}

const BodySchema = z.object({
  owner: z.string().trim().max(120).optional(),
  summary: z.string().trim().max(8000).optional(),
  customer_impact: z.string().trim().max(8000).optional(),
  root_cause: z.string().trim().max(8000).optional(),
  timeline: z.string().trim().max(12000).optional(),
  what_went_well: z.string().trim().max(8000).optional(),
  what_went_wrong: z.string().trim().max(8000).optional(),
  action_items: z.array(z.any()).optional(),
}).strict();

function safeStr(v: unknown, max: number): string {
  return (typeof v === 'string' ? v : '').trim().slice(0, max);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: 'DB client unavailable', requestId }, { status: 503 });

  try {
    const params = ParamsSchema.safeParse(await ctx.params);
    if (!params.success) return NextResponse.json({ ok: false, error: 'ID de incidente inválido', requestId }, { status: 400 });

    const incidentId = params.data.id;
    const db = admin as any;

    const { data, error } = await db
      .from('ops_postmortems')
      .select('*')
      .eq('incident_id', incidentId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json(
      { ok: true, requestId, postmortem: data ?? null },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error en lectura de postmortem';
    await logEvent('api.error', { requestId, route: 'postmortem.get', message: msg });
    return NextResponse.json({ ok: false, error: 'Fallo al recuperar el postmortem', requestId }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const mutation = await requireAdminMutation(req);
  if (!mutation.ok) return mutation.res;

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: 'DB client unavailable', requestId }, { status: 503 });

  try {
    const params = ParamsSchema.safeParse(await ctx.params);
    if (!params.success) return NextResponse.json({ ok: false, error: 'ID inválido', requestId }, { status: 400 });

    const rawBody = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Datos de cuerpo inválidos', details: parsed.error.flatten(), requestId }, { status: 400 });

    const incidentId = params.data.id;
    const body = parsed.data;
    const db = admin as any;

    const patch = {
      incident_id: incidentId,
      owner: safeStr(body.owner || mutation.actor, 120),
      summary: safeStr(body.summary, 8000),
      customer_impact: safeStr(body.customer_impact, 8000),
      root_cause: safeStr(body.root_cause, 8000),
      timeline: safeStr(body.timeline, 12000),
      what_went_well: safeStr(body.what_went_well, 8000),
      what_went_wrong: safeStr(body.what_went_wrong, 8000),
      action_items: Array.isArray(body.action_items) ? body.action_items : [],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await db
      .from('ops_postmortems')
      .upsert(patch, { onConflict: 'incident_id' })
      .select('*')
      .maybeSingle();

    if (error) throw error;

    await logEvent(
      'ops.postmortem.upserted',
      { requestId, incidentId, actor: mutation.actor },
      { source: 'ops', entityId: incidentId, dedupeKey: `upsert:${incidentId}:${requestId}` }
    );

    return NextResponse.json(
      { ok: true, requestId, postmortem: data ?? null },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error en guardado de postmortem';
    await logEvent('api.error', { requestId, route: 'postmortem.post', message: msg });
    return NextResponse.json({ ok: false, error: 'Error al guardar el análisis postmortem', requestId }, { status: 500 });
  }
}