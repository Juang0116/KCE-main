// src/app/api/admin/ops/incidents/[id]/updates/route.ts
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

// 1. Esquema para nuevas actualizaciones del incidente
const UpdateBodySchema = z.object({
  kind: z.enum(['note', 'action', 'status']).default('note'),
  message: z.string().trim().min(1, "El mensaje no puede estar vacío").max(4000),
  meta: z.record(z.unknown()).optional().default({}),
});

function effectiveSignedMode(): 'off' | 'soft' | 'required' {
  const mode = (process.env.SIGNED_ACTIONS_MODE || '').trim();
  if (mode === 'off' || mode === 'soft' || mode === 'required') return mode;
  return process.env.NODE_ENV === 'production' ? 'required' : 'soft';
}

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
        res: NextResponse.json({ ok: false, error: 'Firma de acción requerida', requestId }, { status: 401 }),
      };
    }
    return { ok: true, actor };
  }

  const v = await verifyAndConsumeAdminActionToken(token);
  if (!v.ok) {
    await logEvent('ops.signed_action.rejected', { requestId, actor, route: 'incident-updates' });
    if (mode === 'required') {
      return {
        ok: false,
        res: NextResponse.json({ ok: false, error: v.message, code: v.code, requestId }, { status: 401 }),
      };
    }
  }

  return { ok: true, actor };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: 'DB unavailable', requestId }, { status: 503 });

  try {
    const params = ParamsSchema.safeParse(await ctx.params);
    if (!params.success) return NextResponse.json({ ok: false, error: 'ID de incidente inválido', requestId }, { status: 400 });

    const incidentId = params.data.id;
    const db = admin as any;

    const { data, error } = await db
      .from('ops_incident_updates')
      .select('*')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    return NextResponse.json(
      { ok: true, requestId, items: data ?? [] },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al listar actualizaciones';
    await logEvent('api.error', { requestId, route: 'incident.updates.get', message: msg });
    return NextResponse.json({ ok: false, error: 'Fallo al recuperar la línea de tiempo', requestId }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const mutation = await requireAdminMutation(req);
  if (!mutation.ok) return mutation.res;

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: 'DB unavailable', requestId }, { status: 503 });

  try {
    const params = ParamsSchema.safeParse(await ctx.params);
    if (!params.success) return NextResponse.json({ ok: false, error: 'ID inválido', requestId }, { status: 400 });

    const rawBody = await req.json().catch(() => ({}));
    const parsed = UpdateBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Datos inválidos', details: parsed.error.flatten(), requestId }, { status: 400 });
    }

    const incidentId = params.data.id;
    const { kind, message, meta } = parsed.data;
    const db = admin as any;

    const { data, error } = await db
      .from('ops_incident_updates')
      .insert({
        incident_id: incidentId,
        kind,
        actor: mutation.actor,
        message,
        meta,
        created_at: new Date().toISOString(),
      })
      .select('*')
      .maybeSingle();

    if (error) throw error;

    // Auditoría técnica de la actualización
    await logEvent('ops.incident_update.created', { 
      requestId, 
      incidentId, 
      kind, 
      actor: mutation.actor 
    });

    return NextResponse.json(
      { ok: true, requestId, item: data ?? null },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al crear actualización';
    await logEvent('api.error', { requestId, route: 'incident.updates.post', message: msg });
    return NextResponse.json({ ok: false, error: 'Fallo al registrar la actualización', requestId }, { status: 500 });
  }
}