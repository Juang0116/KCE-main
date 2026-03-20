// src/app/api/admin/metrics/digest/cron/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { logEvent } from '@/lib/events.server';
import { requireInternalHmac } from '@/lib/internalHmac.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { sendOpsDigestEmail } from '@/services/opsDigestEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Margen para consultas pesadas y envío de email

export async function GET(req: NextRequest) {
  // 1. Identificador de trazabilidad
  const requestId = getRequestId(req.headers) || getRequestId(req as any);

  // 2. Autenticación Consolidada (HMAC / Vercel Cron / Bearer Token)
  const hmacErr = await requireInternalHmac(req, { required: false });
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const cronSecret = (process.env.CRON_SECRET || process.env.CRON_API_TOKEN || '').trim();
  const hasValidToken = cronSecret && token === cronSecret;

  // Evaluamos si el acceso debe ser denegado
  if (!hasValidToken && !isVercelCron && hmacErr) {
    await logEvent(
      'security.unauthorized',
      { requestId, route: 'digest.cron', reason: 'Missing valid CRON_SECRET, Vercel header, or HMAC' },
      { source: 'api' }
    );
    return NextResponse.json(
      { ok: false, error: 'Unauthorized', requestId }, 
      { status: 401, headers: withRequestId(undefined, requestId) }
    );
  }

  // 3. Validación de destinatarios
  const to = (process.env.OPS_DIGEST_EMAIL_TO || '').trim();
  if (!to) {
    return NextResponse.json(
      { ok: true, skipped: true, reason: 'OPS_DIGEST_EMAIL_TO not set', requestId }, 
      { status: 200, headers: withRequestId(undefined, requestId) }
    );
  }

  // 4. Configuración de Ventana de Tiempo (24h) y DB
  const days = 1;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    const db = admin as any; // Workaround temporal para tipos que no están en el schema de Supabase

    // 5. Extracción Paralela de Datos
    const [alertsRes, mitigRes, paidRes] = await Promise.all([
      db.from('crm_alerts').select('type, severity, created_at, message').gte('created_at', since).order('created_at', { ascending: false }).limit(50),
      db.from('crm_mitigation_actions').select('action, created_at, details').gte('created_at', since).order('created_at', { ascending: false }).limit(50),
      db.from('events').select('payload, created_at').eq('type', 'checkout.paid').gte('created_at', since)
    ]);

    // Verificación de integridad de consultas
    const dbError = alertsRes.error || mitigRes.error || paidRes.error;
    if (dbError) {
      throw new Error(`DB Error during digest extraction: ${dbError.message}`);
    }

    const alerts = alertsRes.data || [];
    const mitigations = mitigRes.data || [];
    const paid = paidRes.data || [];

    // 6. Procesamiento Financiero
    let revenueMinor = 0;
    let currency = 'EUR'; // Valor por defecto

    for (const e of paid as any[]) {
      const p = (e.payload || {}) as any;
      if (typeof p.amount_total_minor === 'number') {
        revenueMinor += p.amount_total_minor;
      }
      if (p.currency) {
        currency = String(p.currency).toUpperCase();
      }
    }

    // 7. Generación de Plantilla HTML
    const html = `
      <div style="font-family: ui-sans-serif, system-ui, Segoe UI, Roboto, Arial; line-height: 1.4; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 8px;">
        <h2 style="margin: 0 0 10px; color: #0f172a;">KCE Ops Digest (Últimas 24h)</h2>
        <p style="margin: 0 0 16px; color: #334155; font-size: 16px;">
          Ingresos Confirmados: <b style="color: #10b981;">${(revenueMinor / 100).toFixed(2)} ${currency}</b><br/>
          Bookings Pagados: <b>${paid.length}</b>
        </p>

        <h3 style="margin: 24px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Alertas del Sistema (${alerts.length})</h3>
        ${alerts.length > 0 
          ? `<ul style="padding-left: 20px; margin: 0;">${alerts.map((a:any) => `<li style="margin-bottom: 4px;"><b>${a.type}</b> <span style="font-size: 12px; color: #64748b;">(${a.severity})</span> — ${a.message || 'Sin mensaje adicional'}</li>`).join('')}</ul>` 
          : `<p style="color: #64748b; margin: 0;">Todo tranquilo. Sin alertas críticas.</p>`}

        <h3 style="margin: 24px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Mitigaciones Automáticas (${mitigations.length})</h3>
        ${mitigations.length > 0 
          ? `<ul style="padding-left: 20px; margin: 0;">${mitigations.map((m:any) => `<li style="margin-bottom: 4px;"><b>${m.action}</b> — <span style="font-size: 12px; color: #64748b;">${new Date(m.created_at).toLocaleString()}</span></li>`).join('')}</ul>` 
          : `<p style="color: #64748b; margin: 0;">Sin acciones de mitigación ejecutadas.</p>`}

        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; text-align: center;">
          <p style="margin: 0;">KCE Internal Operations • RequestId: ${requestId}</p>
        </div>
      </div>
    `;

    // 8. Envío y Registro
    await sendOpsDigestEmail({ to, subject: `KCE Ops Digest - ${(revenueMinor / 100).toFixed(2)} ${currency}`, html });

    await logEvent(
      'ops.digest_sent',
      { requestId, revenueMinor, alertsCount: alerts.length, mitigationsCount: mitigations.length, recipients: to },
      { source: 'system', dedupeKey: `ops_digest:${new Date().toISOString().split('T')[0]}` }
    );

    return NextResponse.json(
      { ok: true, sent: true, requestId }, 
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al enviar el digest';
    
    await logEvent(
      'api.error', 
      { requestId, route: '/api/admin/metrics/digest/cron', error: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor al procesar el digest', requestId }, 
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}