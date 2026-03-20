// src/app/api/admin/ops/incidents/[id]/postmortem/action-items/sync/route.ts
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
 * Determina si la acción requiere una firma (token) adicional.
 */
function effectiveSignedMode(): 'off' | 'soft' | 'required' {
  const mode = (process.env.SIGNED_ACTIONS_MODE || '').trim();
  if (mode === 'off' || mode === 'soft' || mode === 'required') return mode;
  return process.env.NODE_ENV === 'production' ? 'required' : 'soft';
}

/**
 * Valida permisos y firma de acción administrativa.
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
        res: NextResponse.json({ ok: false, error: 'Falta token de firma (x-admin-action-token)', requestId }, { status: 401 }),
      };
    }
    return { ok: true, actor };
  }

  const verification = await verifyAndConsumeAdminActionToken(token);
  if (!verification.ok) {
    await logEvent('ops.signed_action.rejected', { requestId, actor, code: verification.code, route: 'postmortem-sync' });

    if (mode === 'required') {
      return {
        ok: false,
        res: NextResponse.json({ ok: false, error: verification.message, code: verification.code, requestId }, { status: 401 }),
      };
    }
  }

  return { ok: true, actor };
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req.headers);
  const mutation = await requireAdminMutation(req);
  if (!mutation.ok) return mutation.res;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'DB client not initialized', requestId }, { status: 503 });
  }

  try {
    const params = ParamsSchema.safeParse(await ctx.params);
    if (!params.success) {
      return NextResponse.json({ ok: false, error: 'ID de incidente inválido', requestId }, { status: 400 });
    }

    const incidentId = params.data.id;
    const db = admin as any;

    // 1. Recuperar el Postmortem
    const { data: pm, error: pmError } = await db
      .from('ops_postmortems')
      .select('incident_id, action_items')
      .eq('incident_id', incidentId)
      .maybeSingle();

    if (pmError || !pm) {
      throw new Error(pmError?.message || 'Postmortem no encontrado para este incidente');
    }

    const items = Array.isArray(pm.action_items) ? (pm.action_items as any[]) : [];
    let tasksCreated = 0;
    const updatedItems = [];

    // 2. Sincronización: Transformar items en tareas reales
    for (const item of items) {
      const title = String(item?.title || '').trim();

      // Si no tiene título o ya tiene una tarea vinculada, lo saltamos
      if (!title || item.task_id) {
        updatedItems.push(item);
        continue;
      }

      // Crear la tarea en el backlog general
      const { data: newTask, error: taskError } = await db
        .from('tasks')
        .insert({
          title: `[POSTMORTEM] ${title}`.slice(0, 500),
          status: 'open',
          priority: 'high', // Las tareas de postmortem suelen ser prioritarias
          assigned_to: item.owner ? String(item.owner).slice(0, 200) : null,
          due_at: item.due_at ? String(item.due_at) : null,
          metadata: { incident_id: incidentId, source: 'postmortem' }
        })
        .select('id')
        .single();

      if (!taskError && newTask?.id) {
        updatedItems.push({ ...item, task_id: String(newTask.id) });
        tasksCreated++;
      } else {
        updatedItems.push(item); // Mantener el item original si falla la inserción
      }
    }

    // 3. Actualizar el Postmortem con los nuevos task_ids vinculados
    const { error: updateError } = await db
      .from('ops_postmortems')
      .update({ action_items: updatedItems })
      .eq('incident_id', incidentId);

    if (updateError) throw new Error(`Error al actualizar postmortem: ${updateError.message}`);

    // 4. Registro de Éxito y Auditoría
    await logEvent(
      'ops.postmortem.action_items.synced',
      { requestId, incidentId, tasksCreated, actor: mutation.actor },
      { source: 'ops', entityId: incidentId, dedupeKey: `sync:${incidentId}:${requestId}` }
    );

    return NextResponse.json(
      { ok: true, requestId, incidentId, tasksCreated, action_items: updatedItems },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido en sync';
    await logEvent('api.error', { requestId, route: 'postmortem.sync', message: msg });

    return NextResponse.json(
      { ok: false, error: 'Fallo al sincronizar tareas del postmortem', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}