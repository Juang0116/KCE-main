// src/app/api/admin/ops/breakglass/issue/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability } from '@/lib/adminAuth';
import { issueBreakglassToken } from '@/lib/rbac.server';
import { logEvent } from '@/lib/events.server';
import { logAudit } from '@/lib/auditLog.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Esquema de validación estricto para la solicitud de emergencia
const BodySchema = z.object({
  actor: z.string().min(1, "Se requiere un actor destino"),
  reason: z.string().min(1, "Se requiere un motivo para romper el cristal").max(200).optional(),
  ttlMinutes: z.number().int().min(1).max(60).default(10),
});

/**
 * Emite un token de acceso de emergencia (Breakglass).
 * Este proceso es altamente sensible y requiere autorización explícita.
 */
export async function POST(req: NextRequest) {
  // 2. Identificación y Seguridad de Nivel Superior
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'ops_control');
  
  if (!auth.ok) return auth.response;

  // 3. Verificación de Segundo Factor (Issuer Token)
  const issuerToken = (process.env.OPS_BREAKGLASS_ISSUER_TOKEN || '').trim();
  if (issuerToken) {
    const provided = (req.headers.get('x-ops-approver-token') || '').trim();
    if (!provided || provided !== issuerToken) {
      await logEvent('security.warning', { 
        requestId, 
        action: 'breakglass_forbidden_attempt',
        actor: (auth as any)?.actor 
      });

      return NextResponse.json(
        { ok: false, requestId, error: 'Acceso denegado: Token de emisor inválido' },
        { status: 403, headers: withRequestId(undefined, requestId) },
      );
    }
  }

  try {
    // 4. Parseo y Validación del Cuerpo
    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Datos de solicitud inválidos', details: parsed.error.flatten() },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const { actor, ttlMinutes, reason } = parsed.data;
    const cleanReason = reason?.trim();
    const createdBy = typeof (auth as any)?.actor === 'string' ? String((auth as any).actor).trim() : 'system';

    // 5. Emisión del Token de Emergencia
    const { token, expires_at } = await issueBreakglassToken({
      actor,
      ttlMinutes,
      ...(createdBy ? { createdBy } : {}),
      ...(cleanReason ? { reason: cleanReason } : {}),
    });

    // 6. Registro de Auditoría Crítica (Innegable)
    await logAudit({
      actor: createdBy,
      action: 'security.breakglass_issued',
      requestId,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      entityType: 'rbac_breakglass_tokens',
      entityId: actor,
      payload: { 
        ttlMinutes, 
        expiresAt: expires_at, 
        reason: cleanReason || 'Sin motivo especificado' 
      },
    });

    // Log técnico para monitoreo en tiempo real
    await logEvent('security.breakglass_active', { 
      requestId, 
      actor, 
      issuer: createdBy, 
      ttl: ttlMinutes 
    });

    return NextResponse.json(
      { ok: true, requestId, token, expiresAt: expires_at },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al emitir Breakglass';

    await logEvent('security.error', { 
      requestId, 
      route: '/api/admin/ops/breakglass/issue', 
      message: errorMessage 
    });

    return NextResponse.json(
      { ok: false, requestId, error: 'Fallo crítico al generar el acceso de emergencia' },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}