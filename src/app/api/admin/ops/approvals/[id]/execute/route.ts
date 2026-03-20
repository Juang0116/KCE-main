// src/app/api/admin/ops/approvals/[id]/execute/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminCapability } from '@/lib/adminAuth';
import { approveOpsApproval } from '@/lib/opsApprovals.server';
import { clearChannelPause, pauseChannel } from '@/lib/channelPause.server';
import { clearRuntimeFlag, setRuntimeFlag } from '@/lib/runtimeFlags.server';
import { logEvent } from '@/lib/events.server';
import { logAudit } from '@/lib/auditLog.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Endpoint de ejecución: Aprueba y ejecuta una acción operativa en un solo paso.
 * Útil para la sección de gestión de contenido (posts/videos) y controles de sistema.
 */
export async function POST(
  req: NextRequest, 
  ctx: { params: Promise<{ id: string }> }
) {
  // 1. Identificación y Seguridad
  const requestId = getRequestId(req);
  const auth = await requireAdminCapability(req, 'approvals_execute');
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const admin = getSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Cliente Supabase no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  // 2. Validación de Token de Aprobador (Doble Factor)
  const OPS_APPROVER_TOKEN = (process.env.OPS_APPROVER_TOKEN || '').trim();
  if (OPS_APPROVER_TOKEN) {
    const provided = (req.headers.get('x-ops-approver-token') || '').trim();
    if (!provided || provided !== OPS_APPROVER_TOKEN) {
      await logEvent('security.warning', { requestId, action: 'execute_unauthorized', approvalId: id });
      return NextResponse.json(
        { ok: false, error: 'Token de aprobador inválido o ausente', requestId },
        { status: 403, headers: withRequestId(undefined, requestId) }
      );
    }
  }

  try {
    const db = admin as any; // Bypass temporal de tipos

    // 3. Recuperar la aprobación pendiente
    const { data: approval, error: fetchError } = await db
      .from('crm_ops_approvals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !approval) {
      return NextResponse.json(
        { ok: false, error: 'Aprobación no encontrada', requestId }, 
        { status: 404, headers: withRequestId(undefined, requestId) }
      );
    }

    // 4. Marcar como aprobado en el sistema
    const approved = await approveOpsApproval({ id, approvedBy: 'admin' });
    if (approved.status !== 'approved') {
      return NextResponse.json(
        { ok: false, error: `Estado de aprobación no válido: ${approved.status}`, requestId }, 
        { status: 409, headers: withRequestId(undefined, requestId) }
      );
    }

    // 5. Ejecución Lógica según el Payload
    const payload: any = approved.payload || {};
    const { action } = payload;

    switch (action) {
      case 'pause_channel':
        await pauseChannel(payload.channel, payload.minutes, payload.reason);
        await logEvent('ops.channel_paused', { requestId, channel: payload.channel, minutes: payload.minutes, reason: payload.reason, approvalId: id });
        break;

      case 'resume_channel':
        await clearChannelPause(payload.channel);
        await logEvent('ops.channel_resumed', { requestId, channel: payload.channel, approvalId: id });
        break;

      case 'set_flag':
        await setRuntimeFlag(payload.key, payload.value);
        await logEvent('ops.flag_set', { requestId, key: payload.key, value: payload.value, approvalId: id });
        break;

      case 'clear_flag':
        await clearRuntimeFlag(payload.key);
        await logEvent('ops.flag_cleared', { requestId, key: payload.key, approvalId: id });
        break;

      default:
        return NextResponse.json(
          { ok: false, error: 'Acción operativa no soportada', requestId }, 
          { status: 400, headers: withRequestId(undefined, requestId) }
        );
    }

    // 6. Auditoría de Ejecución
    await logAudit({
      actor: 'admin',
      action: 'ops.approval_executed',
      requestId,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      entityType: 'crm_ops_approvals',
      entityId: id,
      payload: { action, executed: true },
    });

    return NextResponse.json(
      { ok: true, requestId, approvalId: id, action }, 
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido en ejecución operativa';

    await logEvent('api.error', { 
      requestId, 
      route: '/api/admin/ops/approvals/[id]/execute', 
      message: errorMessage,
      approvalId: id
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo crítico al ejecutar la operación aprobada', requestId }, 
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}