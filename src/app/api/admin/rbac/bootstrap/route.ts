// src/app/api/admin/rbac/bootstrap/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminBasicAuth, getAdminActor } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { verifyAndConsumeAdminActionToken } from '@/lib/signedActions.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Determina el nivel de seguridad requerido para acciones firmadas.
 */
function getSecurityMode() {
  const mode = (process.env.SIGNED_ACTIONS_MODE || '').trim().toLowerCase();
  const hasSecret = !!process.env.SIGNED_ACTIONS_SECRET;
  
  if (mode === 'required' || mode === 'soft' || mode === 'off') return { mode, hasSecret };
  
  // Default inteligente basado en el entorno
  return { 
    mode: process.env.NODE_ENV === 'production' && hasSecret ? 'required' : 'off', 
    hasSecret 
  };
}

/**
 * Asegura la existencia del rol 'owner' manejando esquemas legacy.
 */
async function ensureOwnerRole(db: any) {
  // 1. Intentar buscar por esquema moderno
  const { data: modern } = await db.from('crm_roles').select('*').eq('role_key', 'owner').maybeSingle();
  if (modern) return modern;

  // 2. Intentar buscar por esquema legacy
  const { data: legacy } = await db.from('crm_roles').select('*').eq('key', 'owner').maybeSingle();
  if (legacy) return legacy;

  // 3. Crear el rol (Génesis)
  // Intentamos primero con role_key (nuevo estándar de KCE)
  const { error: err1 } = await db.from('crm_roles').insert({ 
    role_key: 'owner', 
    name: 'Owner (System)', 
    permissions: ['*'] 
  });

  if (!err1) return { role_key: 'owner' };

  // Fallback a key si la base de datos es antigua
  const { error: err2 } = await db.from('crm_roles').insert({ 
    key: 'owner', 
    name: 'Owner (Legacy)', 
    permissions: ['*'] 
  });

  if (err2) throw new Error(`Fallo crítico al crear rol de dueño: ${err2.message}`);
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  // 1. Autenticación de Infraestructura (Basic Auth)
  const auth = await requireAdminBasicAuth(req);
  if (!auth.ok) return auth.response;

  try {
    // 2. Validación de Secreto de Bootstrap
    const bootstrapSecret = (process.env.RBAC_BOOTSTRAP_SECRET || '').trim();
    const providedSecret = req.headers.get('x-rbac-bootstrap-secret')?.trim();

    if (!bootstrapSecret || providedSecret !== bootstrapSecret) {
      return NextResponse.json(
        { ok: false, error: 'Secreto de bootstrap inválido o no configurado', requestId },
        { status: 401, headers: withRequestId(undefined, requestId) }
      );
    }

    // 3. Verificación de Firma de Acción (Signed Actions)
    const { mode } = getSecurityMode();
    if (mode === 'required') {
      const token = req.headers.get('x-kce-action-token') || req.headers.get('x-admin-action-token');
      if (!token) {
        return NextResponse.json({ ok: false, error: 'Token de acción firmado requerido', requestId }, { status: 403 });
      }
      const verified = await verifyAndConsumeAdminActionToken(token);
      if (!verified.ok) {
        return NextResponse.json({ ok: false, error: 'Token de acción inválido o expirado', code: verified.code, requestId }, { status: 403 });
      }
    }

    // 4. Inicialización de Datos
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Cliente Supabase Admin no disponible');

    const actor = (await getAdminActor(req) || 'admin_genesis').trim();
    const db = admin as any;

    // Asegurar rol 'owner'
    await ensureOwnerRole(db);

    // Asegurar vinculación Actor -> Owner (Idempotente)
    const { data: binding } = await db
      .from('crm_role_bindings')
      .select('id')
      .eq('actor', actor)
      .eq('role_key', 'owner')
      .maybeSingle();

    if (!binding) {
      const { error: bindErr } = await db.from('crm_role_bindings').insert({
        actor,
        role_key: 'owner',
        created_by: 'system_bootstrap'
      });
      if (bindErr) throw bindErr;
    }

    // 5. Auditoría de Génesis
    await logEvent('rbac.system_bootstrapped', { 
      requestId, 
      actor, 
      role: 'owner',
      securityMode: mode 
    });

    return NextResponse.json(
      { ok: true, message: 'Sistema RBAC inicializado correctamente', actor, role: 'owner', requestId },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido en bootstrap';
    await logEvent('api.error', { requestId, route: 'rbac.bootstrap', error: msg });

    return NextResponse.json(
      { ok: false, error: 'Fallo crítico durante el bootstrap del sistema', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}