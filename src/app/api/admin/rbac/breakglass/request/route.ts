// src/app/api/admin/rbac/breakglass/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability, getAdminActor } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { issueBreakglassToken } from '@/lib/breakglass.server';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  actor: z.string().trim().min(1).optional(),
  reason: z.string().trim().min(5, "Se requiere una razón descriptiva").max(200),
  ttlMinutes: z.coerce.number().int().min(1).max(60).default(30),
}).strict();

/**
 * Procedimiento de Emergencia (Breakglass).
 * Emite un token de acceso temporal con privilegios elevados.
 */
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  // 1. Seguridad: Solo administradores con 'rbac_admin' pueden disparar esto
  const auth = await requireAdminCapability(req, 'rbac_admin');
  if (!auth.ok) return auth.response;

  const admin_actor = (await getAdminActor(req) || 'system_admin').trim();

  try {
    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Datos de solicitud inválidos', details: parsed.error.flatten() },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { actor: targetActor, reason, ttlMinutes } = parsed.data;
    const actor = (targetActor || admin_actor).trim();

    const sb = getSupabaseAdmin();
    if (!sb) throw new Error('Servicio de administración de DB no disponible');

    // 2. Registro de la Solicitud (Estado: Approved por jerarquía rbac_admin)
    const { data: reqRow, error: insError } = await (sb as any)
      .from('crm_breakglass_requests')
      .insert({
        actor,
        reason,
        ttl_minutes: ttlMinutes,
        status: 'approved',
        decided_at: new Date().toISOString(),
        decided_by: admin_actor,
      })
      .select('*')
      .single();

    if (insError) throw insError;

    // 3. Emisión del Token de Emergencia
    // Este token permite saltar verificaciones RBAC estándar por el tiempo definido
    const tokenResult = await issueBreakglassToken({
      actor,
      ttlMinutes,
      reason,
      createdBy: admin_actor,
      reqId: requestId,
    } as any);

    // 4. Backfill del Token ID para Auditoría (Hash por seguridad)
    const tokenId = tokenResult?.token_hash || tokenResult?.token || null;
    if (tokenId) {
      await (sb as any)
        .from('crm_breakglass_requests')
        .update({ token_id: tokenId })
        .eq('id', reqRow.id);
    }

    // 5. Auditoría Crítica de Seguridad
    await logEvent('rbac.breakglass_triggered', {
      requestId,
      requestId_breakglass: reqRow.id,
      actor,
      reason,
      ttl: ttlMinutes,
      triggered_by: admin_actor
    });

    return NextResponse.json(
      { 
        ok: true, 
        requestId, 
        message: 'Acceso de emergencia concedido',
        request: reqRow, 
        token: tokenResult 
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: any) {
    const msg = error instanceof Error ? error.message : 'Error en procedimiento breakglass';
    
    await logEvent('api.error', { 
      requestId, 
      route: 'rbac.breakglass', 
      message: msg 
    });

    return NextResponse.json(
      { ok: false, requestId, error: 'Fallo al procesar el acceso de emergencia' },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}