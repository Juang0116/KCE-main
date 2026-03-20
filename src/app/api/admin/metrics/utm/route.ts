// src/app/api/admin/metrics/utm/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const TRACKED_TYPES = [
  'marketing.utm_capture',
  'newsletter.signup_confirmed',
  'quiz.completed',
  'checkout.paid',
] as const;

function toIsoStart(dateStr: string) {
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

function toIsoEndExclusive(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

function safeRate(n: number, d: number): number {
  return d > 0 ? n / d : 0;
}

/**
 * Reconstruye la llave UTM y sus componentes desde el payload del evento.
 */
function pickUtmKey(payload: any) {
  const p = payload ?? {};
  const utm_source = String(p.utm_source || p.utm?.utm_source || (p.utm_key ? String(p.utm_key).split('/')[0] : '') || 'direct');
  const utm_medium = String(p.utm_medium || p.utm?.utm_medium || (p.utm_key ? String(p.utm_key).split('/')[1] : '') || 'none');
  const utm_campaign = String(p.utm_campaign || p.utm?.utm_campaign || (p.utm_key ? String(p.utm_key).split('/')[2] : '') || 'na');
  const utm_key = `${utm_source}/${utm_medium}/${utm_campaign}`;

  return { utm_key, utm_source, utm_medium, utm_campaign };
}

export async function GET(req: NextRequest) {
  // 1. Seguridad y Contexto
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(new Headers(), requestId) }
    );
  }

  try {
    // 2. Validación de Parámetros
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Parámetros de consulta inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(new Headers(), requestId) }
      );
    }

    // Fechas por defecto: últimos 7 días
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastWeekStr = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const fromYMD = parsed.data.from ?? lastWeekStr;
    const toYMD = parsed.data.to ?? todayStr;

    const db = admin as any;

    // 3. Extracción de Eventos (Límite 5k para procesamiento en memoria)
    const { data: events, error: dbError } = await db
      .from('events')
      .select('type, payload, created_at')
      .in('type', [...TRACKED_TYPES])
      .gte('created_at', toIsoStart(fromYMD))
      .lt('created_at', toIsoEndExclusive(toYMD))
      .limit(5000);

    if (dbError) {
      throw new Error(`DB Error: ${dbError.message}`);
    }

    const rows = events ?? [];

    // Alerta de escalabilidad si llegamos al tope
    if (rows.length >= 5000) {
      await logEvent(
        'metrics.fallback_truncated',
        { requestId, aggregator: 'utm-main', window: { fromYMD, toYMD } },
        { source: 'system' }
      );
    }

    // 4. Agregación en memoria O(N)
    const agg: Record<string, { utm_source: string; utm_medium: string; utm_campaign: string; counts: Record<string, number> }> = {};

    for (const r of rows) {
      const utm = pickUtmKey(r.payload);
      const key = `${utm.utm_source}||${utm.utm_medium}||${utm.utm_campaign}`;
      
      if (!agg[key]) {
        agg[key] = { 
          utm_source: utm.utm_source, 
          utm_medium: utm.utm_medium, 
          utm_campaign: utm.utm_campaign, 
          counts: {} 
        };
      }
      
      const entry = agg[key]!;
      entry.counts[r.type] = (entry.counts[r.type] ?? 0) + 1;
    }

    // 5. Transformación y Cálculo de Conversión
    const items = Object.values(agg)
      .map((x) => {
        const captures = x.counts['marketing.utm_capture'] ?? 0;
        const newsletters = x.counts['newsletter.signup_confirmed'] ?? 0;
        const quizzes = x.counts['quiz.completed'] ?? 0;
        const paid = x.counts['checkout.paid'] ?? 0;

        return {
          ...x,
          utm_key: `${x.utm_source}/${x.utm_medium}/${x.utm_campaign}`,
          utm_captures: captures,
          newsletter_confirmed: newsletters,
          quiz_completed: quizzes,
          checkout_paid: paid,
          rates: {
            confirmPerCapture: safeRate(newsletters, captures),
            quizPerCapture: safeRate(quizzes, captures),
            paidPerCapture: safeRate(paid, captures),
            paidPerQuiz: safeRate(paid, quizzes),
          },
        };
      })
      .sort((a, b) => 
        (b.checkout_paid - a.checkout_paid) || 
        (b.quiz_completed - a.quiz_completed) || 
        (b.utm_captures - a.utm_captures)
      );

    // 6. Resumen General (Totals)
    const totals = items.reduce(
      (acc, r) => {
        acc.utm_captures += r.utm_captures;
        acc.newsletter_confirmed += r.newsletter_confirmed;
        acc.quiz_completed += r.quiz_completed;
        acc.checkout_paid += r.checkout_paid;
        return acc;
      },
      { utm_captures: 0, newsletter_confirmed: 0, quiz_completed: 0, checkout_paid: 0 }
    );

    const summary = {
      totals,
      rates: {
        confirmPerCapture: safeRate(totals.newsletter_confirmed, totals.utm_captures),
        quizPerCapture: safeRate(totals.quiz_completed, totals.utm_captures),
        paidPerCapture: safeRate(totals.checkout_paid, totals.utm_captures),
        paidPerQuiz: safeRate(totals.checkout_paid, totals.quiz_completed),
      },
    };

    return NextResponse.json(
      { 
        ok: true, 
        requestId, 
        window: { from: fromYMD, to: toYMD }, 
        summary, 
        items,
        count_truncated: rows.length >= 5000
      },
      { headers: withRequestId(new Headers(), requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar métricas UTM';

    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/utm', message: errorMessage },
      { source: 'api' }
    );

    return NextResponse.json(
      { ok: false, requestId, error: 'Fallo al recuperar analíticas de fuentes UTM' },
      { status: 500, headers: withRequestId(new Headers(), requestId) }
    );
  }
}