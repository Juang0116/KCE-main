// src/app/api/admin/outbound/cron/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { logEvent } from '@/lib/events.server';
import { processOutboundQueue } from '@/lib/outbound.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { requireInternalHmac } from '@/lib/internalHmac.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  dryRun: z.boolean().default(false),
}).strict();

function getBearer(req: NextRequest) {
  const h = req.headers.get('authorization') || '';
  return h.replace(/^Bearer\s+/i, '').trim();
}

/**
 * Intenta adquirir un bloqueo distribuido para evitar colisiones.
 */
async function acquireCronLock(admin: any, key: string, ttlSeconds: number): Promise<boolean> {
  try {
    // Limpieza de bloqueos viejos
    await admin.from('event_locks').delete().lt('expires_at', new Date().toISOString());

    const nowIso = new Date().toISOString();
    const expIso = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    const { data, error } = await admin
      .from('event_locks')
      .insert({ 
        scope: 'cron', 
        key: `outbound:${key}`, 
        owner: 'cron_executor', 
        acquired_at: nowIso, 
        expires_at: expIso 
      })
      .select('id')
      .maybeSingle();

    return !error && !!data?.id;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  // 1. Autorización: Bearer Token, Vercel Cron Header o HMAC
  // hmacError será null si es correcto o si no existe el header.
  const hmacError = await requireInternalHmac(req, { required: false });
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  
  const token = getBearer(req);
  const expectedToken = (process.env.CRON_SECRET || process.env.CRON_API_TOKEN || '').trim();
  const bearerOk = expectedToken && token === expectedToken;

  // LÓGICA DE SEGURIDAD CORREGIDA:
  // Si hay un error de HMAC (hmacError != null) y no es Cron ni Bearer -> Denegado.
  // Si no hay error de HMAC pero tampoco es Cron ni Bearer -> Denegado.
  if ((hmacError && !isVercelCron && !bearerOk) || (!hmacError && !isVercelCron && !bearerOk)) {
    // Si hmacError es un NextResponse, lo devolvemos; si no, genérico 401.
    return hmacError || NextResponse.json(
      { error: 'No autorizado', requestId }, 
      { status: 401, headers: withRequestId(undefined, requestId) }
    );
  }

  if (!admin) {
    return NextResponse.json({ error: 'DB admin unavailable', requestId }, { status: 500 });
  }

  // 2. Control de Concurrencia
  const locked = await acquireCronLock(admin, 'dispatch', 15 * 60);
  if (!locked) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'Lock active', requestId });
  }

  try {
    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues, requestId }, { status: 400 });
    }

    const { limit, dryRun } = parsed.data;

    // 3. Procesar cola
    const out = await processOutboundQueue({ limit, dryRun, requestId });
    
    await logEvent('cron.outbound.success', { requestId, ...out, dryRun }, { source: 'cron' });

    return NextResponse.json({ ok: true, ...out, requestId }, { status: 200 });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown cron error';
    await logEvent('api.error', { requestId, where: 'cron.outbound', error: msg }, { source: 'cron' });

    return NextResponse.json({ error: 'Fallo en la ejecución del cron', requestId }, { status: 500 });
  }
}