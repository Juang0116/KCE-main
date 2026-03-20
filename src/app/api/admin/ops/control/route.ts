// src/app/api/admin/ops/control/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability } from '@/lib/adminAuth';
import { clearChannelPause, pauseChannel } from '@/lib/channelPause.server';
import { clearRuntimeFlag, setRuntimeFlag } from '@/lib/runtimeFlags.server';
import { createOpsApproval } from '@/lib/opsApprovals.server';
import { logAudit } from '@/lib/auditLog.server';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Esquema de acciones permitidas en la consola de control
const BodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('pause_channel'),
    channel: z.string().min(1),
    minutes: z.coerce.number().int().min(1).max(10080), // Máximo 1 semana
    reason: z.string().min(1).max(280),
  }),
  z.object({
    action: z.literal('resume_channel'),
    channel: z.string().min(1),
  }),
  z.object({
    action: z.literal('set_flag'),
    key: z.string().min(1),
    value: z.string().min(1).max(200),
  }),
  z.object({
    action: z.literal('clear_flag'),
    key: z.string().min(1),
  }),
]);

/**
 * Orquestador de control operativo. 
 * Gestiona ejecuciones directas o solicitudes de aprobación (Dual-Control).
 */
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const auth = await requireAdminCapability(req, 'ops_control');
  if (!auth.ok) return auth.response;

  // Configuración de seguridad (Dual-Control)
  const OPS_TWO_MAN_RULE = (process.env.OPS_TWO_MAN_RULE || '').trim().toLowerCase() === 'true' || process.env.OPS_TWO_MAN_RULE === '1';
  const ttlMinutes = Number(process.env.OPS_APPROVAL_TTL_MINUTES) || 15;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Servicio de base de datos no disponible', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Payload de control inválido', issues: parsed.error.issues, requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const b = parsed.data;

    // 2. Lógica de "Regla de Dos Personas" (Dual-Control)
    // Si está activa, no ejecutamos; creamos una solicitud de aprobación.
    if (OPS_TWO_MAN_RULE) {
      const approval = await createOpsApproval({
        action: b.action,
        payload: b as any,
        requestId,
        requestedBy: 'admin',
        ttlMinutes,
      });

      await logAudit({
        actor: 'admin',
        action: 'ops.approval_requested',
        requestId,
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        entityType: 'crm_ops_approvals',
        entityId: approval.id,
        payload: { action: b.action, ttlMinutes },
      });

      return NextResponse.json(
        { ok: true, pending: true, approvalId: approval.id, expiresAt: approval.expires_at, requestId },
        { status: 202, headers: withRequestId(undefined, requestId) },
      );
    }

    // 3. Ejecución Inmediata (Solo si OPS_TWO_MAN_RULE = false)
    switch (b.action) {
      case 'pause_channel':
        await pauseChannel(b.channel, b.minutes, b.reason);
        await logEvent('ops.channel_paused', { requestId, channel: b.channel, minutes: b.minutes, reason: b.reason });
        break;

      case 'resume_channel':
        await clearChannelPause(b.channel);
        await logEvent('ops.channel_resumed', { requestId, channel: b.channel });
        break;

      case 'set_flag':
        await setRuntimeFlag(b.key, b.value);
        await logEvent('ops.flag_set', { requestId, key: b.key, value: b.value });
        break;

      case 'clear_flag':
        await clearRuntimeFlag(b.key);
        await logEvent('ops.flag_cleared', { requestId, key: b.key });
        break;
    }

    return NextResponse.json(
      { ok: true, action: b.action, requestId }, 
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido en consola de control';
    
    await logEvent('api.error', { 
      requestId, 
      route: '/api/admin/ops/control', 
      message: errorMessage 
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo al ejecutar la acción de control', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}