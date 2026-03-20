// src/app/api/admin/ops/backups/run/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Esquema de validación flexible (sin .strict() para mayor compatibilidad)
const BackupLogSchema = z.object({
  kind: z.enum(['db', 'storage', 'config']).default('db'),
  provider: z.string().trim().max(80).optional(),
  location: z.string().trim().max(200).optional(),
  ok: z.boolean().default(true),
  message: z.string().trim().max(500).optional(),
});

/**
 * Registra el resultado de una ejecución de backup en el log operativo.
 */
export async function POST(req: NextRequest) {
  // 2. Identificación y Seguridad
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'ops.manage');
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Servicio de base de datos de administración no disponible', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 3. Parseo y Validación de Payload
    const json = await req.json().catch(() => ({}));
    const parsed = BackupLogSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Payload de registro inválido', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { data } = parsed;
    
    // Workaround para tipos de Supabase desalineados
    const db = admin as any;

    const row = {
      kind: data.kind,
      provider: data.provider ?? null,
      location: data.location ?? null,
      ok: data.ok,
      message: data.message ?? null,
      created_at: new Date().toISOString(),
    };

    // 4. Inserción en el log de Backups
    const { error: dbError } = await db.from('ops_backups_log').insert(row);

    if (dbError) {
      await logEvent('api.error', { 
        requestId, 
        route: '/api/admin/ops/backups/run', 
        message: `Fallo al insertar log de backup: ${dbError.message}` 
      });

      return NextResponse.json(
        { ok: false, error: 'Error al persistir el log de backup', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) }
      );
    }

    // 5. Auditoría de éxito
    await logEvent('ops.backup_logged', { 
      requestId, 
      kind: data.kind, 
      ok: data.ok, 
      provider: data.provider 
    });

    return NextResponse.json(
      { ok: true, requestId }, 
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el registro de backup';

    await logEvent('api.error', { 
      requestId, 
      route: '/api/admin/ops/backups/run', 
      message: errorMessage 
    });

    return NextResponse.json(
      { ok: false, error: 'Fallo interno del servidor', requestId }, 
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}