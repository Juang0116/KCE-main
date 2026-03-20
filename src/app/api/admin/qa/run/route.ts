// src/app/api/admin/qa/run/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getAllowedOrigins } from '@/lib/cors';
import { publicEnv, serverEnv } from '@/lib/env';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  mode: z.string().optional().transform((v) => (v === 'prod' || v === 'production' ? 'prod' : 'dev')),
  deep: z.string().optional().transform((v) => v === '1' || v === 'true'),
});

interface Check {
  id: string;
  label: string;
  ok: boolean;
  ms: number;
  detail?: string;
}

/**
 * Agrega un resultado de chequeo respetando exactOptionalPropertyTypes.
 * Si detail es null o undefined, la propiedad simplemente no se añade al objeto.
 */
function addCheck(
  checks: Check[],
  c: { id: string; label: string; ok: boolean; ms: number; detail?: string | null }
) {
  const { detail, ...rest } = c;
  const entry: Check = { ...rest };
  
  if (typeof detail === 'string' && detail.trim().length > 0) {
    entry.detail = detail;
  }
  
  checks.push(entry);
}

/**
 * Mide el tiempo de ejecución de una promesa.
 */
async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; value: T }> {
  const t0 = performance.now();
  const value = await fn();
  return { ms: Math.round(performance.now() - t0), value };
}

const isPresent = (v: unknown): boolean => Boolean(v) && String(v).trim().length > 0;

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Admin client unavailable', requestId }, { status: 503 });
  }

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  
  const deep = parsed.success ? parsed.data.deep : false;
  const prod = (parsed.success ? parsed.data.mode : 'dev') === 'prod';

  const checks: Check[] = [];

  // 1. Verificación de Variables de Entorno
  const envStart = performance.now();
  const supabaseOk = isPresent(serverEnv.SUPABASE_SERVICE_ROLE_KEY) && isPresent(publicEnv.NEXT_PUBLIC_SUPABASE_URL);
  
  addCheck(checks, {
    id: 'env.supabase',
    label: 'Configuración Supabase (URL/Keys)',
    ok: supabaseOk,
    ms: Math.round(performance.now() - envStart),
    detail: supabaseOk ? null : 'Faltan variables críticas de Supabase'
  });

  // 2. Conectividad Base de Datos (Paralelizada para mayor velocidad)
  const coreTables = ['bookings', 'tours', 'events', 'leads'] as const;
  const tableResults = await Promise.all(coreTables.map(table => 
    timed(async () => {
      const db = admin as any;
      return db.from(table).select('id', { count: 'exact', head: true }).limit(1);
    })
  ));

  tableResults.forEach((res, i) => {
    const errorMsg = res.value.error?.message;
    addCheck(checks, {
      id: `db.${coreTables[i]}`,
      label: `Tabla: ${coreTables[i]} (Conectividad)`,
      ok: !res.value.error, // Asegura booleano puro
      ms: res.ms,
      detail: errorMsg || null
    });
  });

  // 3. Prueba de Escritura (Idempotente)
  const writePing = await timed(async () => {
    const db = admin as any;
    return db.from('events').insert({
      type: 'qa.ping',
      payload: { requestId },
      dedupe_key: `qa:ping:${requestId}`,
      source: 'qa'
    } as any).select('id').maybeSingle();
  });

  addCheck(checks, {
    id: 'db.write',
    label: 'Supabase: Permisos de Escritura (Ping)',
    ok: !writePing.value.error,
    ms: writePing.ms,
    detail: writePing.value.error?.message || null
  });

  // 4. Verificación de Storage (Buckets)
  const storageCheck = await timed(() => admin.storage.listBuckets());
  const hasAvatars = (storageCheck.value.data ?? []).some(b => b.name === 'review_avatars');
  
  addCheck(checks, {
    id: 'storage.buckets',
    label: 'Storage: Bucket "review_avatars"',
    ok: !storageCheck.value.error && hasAvatars,
    ms: storageCheck.ms,
    detail: !hasAvatars ? 'No se encontró el bucket de avatares' : null
  });

  // 5. Verificación de Stripe (Deep Check opcional)
  if (isPresent(serverEnv.STRIPE_SECRET_KEY)) {
    const stripeStart = performance.now();
    let stripeOk = true;
    let stripeDetail: string | null = null;

    if (deep) {
      try {
        const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any });
        await stripe.accounts.retrieve();
      } catch (e: any) {
        stripeOk = false;
        stripeDetail = e.message;
      }
    }

    addCheck(checks, {
      id: 'stripe.health',
      label: deep ? 'Stripe: Red y Credenciales' : 'Stripe: Formato de Key',
      ok: stripeOk,
      ms: Math.round(performance.now() - stripeStart),
      detail: stripeDetail
    });
  }

  const allPassed = checks.every(c => c.ok);

  // Registro de auditoría silencioso
  void logEvent('admin.qa_run', { requestId, ok: allPassed, mode: prod ? 'prod' : 'dev' });

  return NextResponse.json({
    ok: allPassed,
    requestId,
    summary: {
      passed: checks.filter(c => c.ok).length,
      failed: checks.filter(c => !c.ok).length,
      total_ms: checks.reduce((acc, c) => acc + c.ms, 0)
    },
    checks
  }, { 
    status: 200, 
    headers: withRequestId({ 'Cache-Control': 'no-store' }, requestId) 
  });
}