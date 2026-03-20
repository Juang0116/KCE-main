// src/app/api/admin/metrics/marketing/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Zod reemplaza a clamp() y parseDaysParam() de forma nativa
const QuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(120).default(30),
});

/**
 * Función auxiliar para el conteo de eventos.
 * Ahora incluye inyección de dependencias (db) y manejo de errores estricto.
 */
async function countByType(db: any, type: string, sinceISO: string) {
  const { count, error } = await db
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('type', type)
    .gte('created_at', sinceISO);

  if (error) {
    throw new Error(`Error contando evento de marketing [${type}]: ${error.message}`);
  }
  
  return count ?? 0;
}

export async function GET(req: NextRequest) {
  // 2. Autenticación y configuración inicial
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  // Defensa temprana contra fallos de inicialización del backend
  if (!admin) {
    return NextResponse.json(
      { error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 3. Parseo y validación de la ventana de tiempo
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      days: url.searchParams.get('days') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { days } = parsed.data;
    const sinceISO = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const db = admin as any; // Workaround para tipos Database inestables

    // Primitivas del embudo de marketing
    const types = [
      'marketing.utm_capture',
      'tour.view',
      'quiz.completed',
      'newsletter.signup_pending',
      'newsletter.signup_confirmed',
      'checkout.paid',
      'email.booking_confirmation.sent',
      'lead_magnet.eu_guide.requested',
      'email.lead_magnet.eu_guide.sent',
    ] as const;

    // 4. Ejecución Paralela: Obtenemos todos los conteos simultáneamente (O(1) en latencia de red)
    const results = await Promise.all(
      types.map((t) => countByType(db, t, sinceISO))
    );

    // Mapeo de resultados al diccionario counts
    const counts: Record<string, number> = {};
    types.forEach((t, i) => {
      counts[t] = results[i];
    });

    // 5. Extracción y Cálculo de Tasas de Conversión (Rates)
    const utm = counts['marketing.utm_capture'] || 0;
    const tourView = counts['tour.view'] || 0;
    const quiz = counts['quiz.completed'] || 0;
    const nlConfirmed = counts['newsletter.signup_confirmed'] || 0;
    const paid = counts['checkout.paid'] || 0;

    const safeRate = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

    return NextResponse.json(
      {
        ok: true,
        requestId,
        windowDays: days,
        sinceISO,
        counts,
        rates: {
          tourView_per_utm: safeRate(tourView, utm),
          quiz_per_tourView: safeRate(quiz, tourView),
          newsletterConfirmed_per_quiz: safeRate(nlConfirmed, quiz),
          paid_per_tourView: safeRate(paid, tourView),
        },
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al calcular métricas de marketing';
    
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/marketing', message: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}