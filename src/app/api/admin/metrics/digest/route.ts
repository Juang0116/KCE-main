// src/app/api/admin/ops/summary/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminCapability } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 1. Trazabilidad y Autenticación Basada en Roles (RBAC)
  const requestId = getRequestId(req) || getRequestId(req.headers as any);
  const auth = await requireAdminCapability(req, 'metrics_view');
  if (!auth.ok) return auth.response;

  // 2. Configuración de Entorno y Base de Datos
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  // 3. Procesamiento seguro de parámetros URL
  const url = new URL(req.url);
  const days = Math.min(30, Math.max(1, Number(url.searchParams.get('days') || '1')));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    /**
     * NOTE: En algunos despliegues los tipos generados de Supabase pueden no
     * incluir todavía tablas nuevas (p.ej. crm_alerts / crm_mitigation_actions).
     * Hacemos un cast puntual a `any` para evitar fallos de compilación (Next Build)
     * mientras se regeneran y alinean los tipos de la Database.
     */
    const db = admin as any;

    // 4. Extracción Paralela de Datos Operativos
    const [alertsRes, mitigRes, paidRes] = await Promise.all([
      db.from('crm_alerts').select('type, severity, created_at').gte('created_at', since),
      db.from('crm_mitigation_actions').select('action, created_at').gte('created_at', since),
      db.from('events').select('type, payload, created_at').eq('type', 'checkout.paid').gte('created_at', since),
    ]);

    // Verificación estricta de errores en la consulta masiva
    const dbError = alertsRes.error || mitigRes.error || paidRes.error;
    if (dbError) {
      throw new Error(`DB Error en ops summary: ${dbError.message}`);
    }

    const alerts = alertsRes.data || [];
    const mitigations = mitigRes.data || [];
    const paid = paidRes.data || [];

    // 5. Agregación en Memoria (O(N))
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    
    for (const a of alerts as any[]) {
      const type = typeof a.type === 'string' ? a.type : 'unknown';
      const severity = typeof a.severity === 'string' ? a.severity : 'unknown';
      
      byType[type] = (byType[type] || 0) + 1;
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;
    }

    const mitByAction: Record<string, number> = {};
    for (const m of mitigations as any[]) {
      const action = typeof m.action === 'string' ? m.action : 'unknown';
      mitByAction[action] = (mitByAction[action] || 0) + 1;
    }

    let revenueMinor = 0;
    let currency = 'EUR'; // Moneda por defecto

    for (const e of paid as any[]) {
      const p = (e.payload || {}) as any;
      if (typeof p.amount_total_minor === 'number') {
        revenueMinor += p.amount_total_minor;
      }
      if (p.currency) {
        currency = String(p.currency).toUpperCase();
      }
    }

    // 6. Respuesta Consolidada
    return NextResponse.json(
      {
        ok: true,
        requestId,
        windowDays: days,
        since,
        alerts: { total: alerts.length, byType, bySeverity },
        mitigations: { total: mitigations.length, byAction: mitByAction },
        paid: { total: paid.length, revenueMinor, currency },
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al generar resumen operativo';
    
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/ops/summary', error: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { ok: false, error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}