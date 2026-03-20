// src/app/api/admin/rbac/effective/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminCapability, getAdminActor } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getEffectiveAccess } from '@/lib/rbac.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Recupera el perfil de acceso efectivo del administrador actual.
 * Resuelve la jerarquía de roles y aplana los permisos para el cliente.
 */
export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  // 1. Seguridad: Solo usuarios con acceso administrativo básico pueden ver su perfil
  const guard = await requireAdminCapability(req, 'admin_access');
  if (!guard.ok) return guard.response;

  try {
    // 2. Identificación del Actor
    const actorRaw = await getAdminActor(req).catch(() => 'admin_unknown');
    const actor = String(actorRaw).trim() || 'admin';

    // 3. Resolución de Permisos
    // getEffectiveAccess consulta la base de datos y calcula la unión de todos los roles
    const access = await getEffectiveAccess(actor);

    // 4. Registro de Auditoría de Seguridad
    await logEvent('rbac.effective_access_viewed', {
      requestId,
      actor,
      roleCount: access.roles.length,
      permissionCount: access.permissions.length,
      isSuperAdmin: access.hasAll
    });

    return NextResponse.json(
      {
        ok: true,
        requestId,
        actor: access.actor,
        roles: access.roles,
        permissions: access.permissions,
        hasAll: access.hasAll, // true si tiene el permiso '*'
      },
      { 
        status: 200, 
        headers: withRequestId({ 'Cache-Control': 'no-store' }, requestId) 
      }
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al resolver permisos efectivos';
    
    await logEvent('api.error', { 
      requestId, 
      route: 'rbac.effective', 
      message: msg 
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo al calcular el perfil de acceso', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}