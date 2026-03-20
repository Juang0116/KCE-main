// src/app/api/admin/metrics/utm/top/route.ts
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
  min_captures: z.coerce.number().int().min(0).max(100000).default(30),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

const TRACKED_TYPES = [
  'marketing.utm_capture',
  'newsletter.signup_confirmed',
  'quiz.completed',
  'checkout.paid',
] as const;

type EventType = (typeof TRACKED_TYPES)[number];

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
 * Reconstruye la estructura UTM desde el payload del evento.
 */
function pickUtmKey(payload: any) {
  const p = payload ?? {};
  const utm_source = String(p.utm_source || p.utm?.utm_source || (p.utm_key ? String(p.utm_key).split('/')[0] : '') || 'direct');
  const utm_medium = String(p.utm_medium || p.utm?.utm_medium || (p.utm_key ? String(p.utm_key).split('/')[1] : '') || 'none');
  const utm_campaign = String(p.utm_campaign || p.utm?.utm_campaign || (p.utm_key ? String(p.utm_key).split('/')[2] : '') || 'na');
  const utm_key = `${utm_source}/${utm_medium}/${utm_campaign}`;

  return { utm_key, utm_source, utm_medium, utm_campaign };
}

type AggItem = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  counts: Partial<Record<EventType, number>>;
};

export async function GET(req: NextRequest) {
  // 1. Seguridad y Contexto
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(new Headers(), requestId) }
    );
  }

  try {
    // 2. Validación de Parámetros
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
      min_captures: url.searchParams.get('min_captures') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(new Headers(), requestId) }
      );
    }

    const { min_captures, limit, from: fromParam, to: toParam } = parsed.data;
    
    // Ventana por defecto: últimos 7 días
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastWeekStr = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const fromYMD = fromParam ?? lastWeekStr;
    const toYMD = toParam ?? todayStr;

    const db = admin as any;

    // 3. Extracción de Eventos (Límite 10k para seguridad de memoria)
    const { data: events, error: dbError } = await db
      .from('events')
      .select('type, payload')
      .in('type', [...TRACKED_TYPES])
      .gte('created_at', toIsoStart(fromYMD))
      .lt('created_at', toIsoEndExclusive(toYMD))
      .limit(10000);

    if (dbError) {
      throw new Error(`Error de base de datos: ${dbError.message}`);
    }

    const rows = events ?? [];

    // Alerta de escalabilidad: si tocamos el techo de 10k eventos
    if (rows.length >= 10000) {
      await logEvent(
        'metrics.fallback_truncated',
        { requestId, aggregator: 'utm-top-performance', window: { fromYMD, toYMD } },
        { source: 'system' }
      );
    }

    // 4. Agregación en memoria O(N)
    const agg: Record<string, AggItem> = {};

    for (const r of rows) {
      const utm = pickUtmKey(r.payload);
      
      if (!agg[utm.utm_key]) {
        agg[utm.utm_key] = {
          utm_source: utm.utm_source,
          utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign,
          counts: {},
        };
      }

      const entry = agg[utm.utm_key]!;
      const type = r.type as EventType;
      entry.counts[type] = (entry.counts[type] ?? 0) + 1;
    }

    // 5. Transformación y Cálculo de Conversión
    const items = Object.entries(agg)
      .map(([utm_key, x]) => {
        const captures = x.counts['marketing.utm_capture'] ?? 0;
        const signups = x.counts['newsletter.signup_confirmed'] ?? 0;
        const quizzes = x.counts['quiz.completed'] ?? 0;
        const sales = x.counts['checkout.paid'] ?? 0;

        return {
          utm_key,
          utm_source: x.utm_source,
          utm_medium: x.utm_medium,
          utm_campaign: x.utm_campaign,
          utm_captures: captures,
          newsletter_confirmed: signups,
          quiz_completed: quizzes,
          checkout_paid: sales,
          rates: {
            quizPerCapture: safeRate(quizzes, captures),
            confirmPerCapture: safeRate(signups, captures),
            paidPerCapture: safeRate(sales, captures),
            paidPerQuiz: safeRate(sales, quizzes),
          },
        };
      })
      .filter((x) => x.utm_captures >= min_captures)
      .sort((a, b) => 
        (b.rates.paidPerCapture - a.rates.paidPerCapture) || 
        (b.checkout_paid - a.checkout_paid) || 
        (b.utm_captures - a.utm_captures)
      )
      .slice(0, limit);

    return NextResponse.json(
      { 
        ok: true, 
        requestId, 
        window: { from: fromYMD, to: toYMD }, 
        params: { min_captures, limit }, 
        items,
        count_truncated: rows.length >= 10000
      },
      { headers: withRequestId(new Headers(), requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al calcular el top UTM';

    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/utm/top', message: errorMessage },
      { source: 'api' }
    );

    return NextResponse.json(
      { ok: false, requestId, error: 'Fallo al procesar analíticas de campañas UTM' },
      { status: 500, headers: withRequestId(new Headers(), requestId) }
    );
  }
}