// src/app/api/admin/ops/notify/test/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getAdminActor, requireAdminBasicAuth } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { notifyOps } from '@/lib/opsNotify.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Esquema de validación para la prueba de notificación.
 * Mapeamos 'error' a 'critical' internamente.
 */
const BodySchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(140),
  message: z.string().trim().min(1, "El mensaje es obligatorio").max(5000),
  severity: z.enum(['info', 'warn', 'error', 'critical']).default('info'),
}).strict();

/**
 * Verifica si los canales de salida están configurados en el entorno.
 */
function checkOpsConfig() {
  const email = String(process.env.OPS_NOTIFY_EMAIL || '').trim();
  const webhook = String(process.env.OPS_NOTIFY_WEBHOOK_URL || '').trim();
  return { email, webhook, isOk: Boolean(email || webhook) };
}

/**
 * Normaliza la severidad para el motor de NotifyPayload.
 */
function normalizeSeverity(s: string): 'info' | 'warn' | 'critical' {
  if (s === 'error' || s === 'critical') return 'critical';
  if (s === 'warn') return 'warn';
  return 'info';
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  // 1. Seguridad: Requiere Basic Auth para este test de infraestructura
  const auth = await requireAdminBasicAuth(req);
  if (!auth.ok) return auth.response;

  // Normalización del actor (quién dispara el test)
  const actorRaw = await getAdminActor(req).catch(() => 'admin');
  const actor = typeof actorRaw === 'string' ? actorRaw.trim() : 'admin';

  // 2. Verificación de Capacidad
  const conf = checkOpsConfig();
  if (!conf.isOk) {
    return NextResponse.json(
      { 
        ok: false, 
        requestId, 
        error: 'Canales de notificación no configurados (Faltan variables OPS_NOTIFY_EMAIL o WEBHOOK_URL)' 
      },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 3. Validación de Datos
    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Datos de prueba inválidos', details: parsed.error.flatten() },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { title, message, severity: rawSeverity } = parsed.data;
    const severity = normalizeSeverity(rawSeverity);

    let delivered = true;
    let deliveryError: string | null = null;

    // 4. Ejecución del Test de Notificación
    try {
      await notifyOps({
        title: `[TEST] ${title}`,
        text: message,
        severity,
        meta: { requestId, actor, isTest: true },
      });
    } catch (e: unknown) {
      delivered = false;
      deliveryError = e instanceof Error ? e.message : 'Error de conexión desconocido';
      
      await logEvent('api.error', { 
        requestId, 
        where: 'ops.notify_test.delivery', 
        error: deliveryError 
      });
    }

    // 5. Registro de Auditoría
    await logEvent('ops.notify_test.executed', {
      requestId,
      actor,
      delivered,
      severity,
      hasEmail: Boolean(conf.email),
      hasWebhook: Boolean(conf.webhook),
      error: deliveryError
    });

    return NextResponse.json(
      { 
        ok: true, 
        requestId, 
        delivered, 
        config: { email: !!conf.email, webhook: !!conf.webhook },
        error: deliveryError 
      },
      { status: delivered ? 200 : 500, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error inesperado en ruta de test';
    
    await logEvent('api.error', { requestId, route: 'ops.notify_test', error: msg });

    return NextResponse.json(
      { ok: false, requestId, error: 'Fallo crítico al procesar la prueba de notificación' },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}