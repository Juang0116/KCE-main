// src/app/api/admin/ops/approvals/[id]/approve/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminCapability } from '@/lib/adminAuth';
import { approveOpsApproval } from '@/lib/opsApprovals.server';
import { logAudit } from '@/lib/auditLog.server';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Procesa la aprobación de una operación crítica.
 * Requiere capacidad 'approvals_execute' y un token de seguridad x-ops-approver-token.
 */
export async function POST(
  req: NextRequest, 
  ctx: { params: Promise<{ id: string }> }
) {
  // 1. Contexto y Seguridad Inicial
  const requestId = getRequestId(req);
  const auth = await requireAdminCapability(req, 'approvals_execute');
  if (!auth.ok) return auth.response;

  // 2. Validación de Token de Aprobación Crítica (Doble Factor)
  const OPS_APPROVER_TOKEN = (process.env.OPS_APPROVER_TOKEN || '').trim();
  if (OPS_APPROVER_TOKEN) {
    const provided = (req.headers.get('x-ops-approver-token') || '').trim();
    if (!provided || provided !== OPS_APPROVER_TOKEN) {
      await logEvent('security.warning', { 
        requestId, 
        reason: 'Intento de aprobación sin token o token inválido',
        path: req.nextUrl.pathname 
      });

      return NextResponse.json(
        { ok: false, error: 'Token de aprobador ausente o inválido', requestId },
        { status: 403, headers: withRequestId(undefined, requestId) },
      );
    }
  }

  const { id } = await ctx.params;

  try {
    // 3. Ejecución de la Aprobación en el core del sistema
    const approved = await approveOpsApproval({ id, approvedBy: 'admin' });

    // 4. Registro de Auditoría de Cumplimiento (Compliance)
    // Es vital registrar quién hizo la acción y desde dónde
    await logAudit({
      actor: 'admin',
      action: 'ops.approval_approved',
      requestId,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      entityType: 'crm_ops_approvals',
      entityId: id,
      payload: { 
        status: approved.status,
        timestamp: new Date().toISOString()
      },
    });

    return NextResponse.json(
      { ok: true, approval: approved, requestId }, 
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar la aprobación';

    // Registro de error técnico para el equipo de Ops
    await logEvent('api.error', { 
      requestId, 
      route: '/api/admin/ops/approvals/[id]/approve', 
      message: errorMessage,
      entityId: id
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo interno al procesar la aprobación operativa', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}