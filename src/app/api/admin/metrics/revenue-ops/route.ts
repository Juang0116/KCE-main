// src/app/api/admin/metrics/revenue-ops/route.ts
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
  days: z.coerce.number().int().min(1).max(180).default(30),
});

const iso = (d: Date) => d.toISOString();

export async function GET(req: NextRequest) {
  // 1. Seguridad y Contexto
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 2. Validación de Parámetros
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
    const to = new Date();
    const from = new Date(to.getTime() - days * 86400000);
    const fromStr = iso(from);

    const db = admin as any;

    // 3. Extracción de Datos en Paralelo (O(1) en latencia de red)
    const [activeRes, wonRes, outRes] = await Promise.all([
      // Tratos activos (Pipeline)
      db.from('deals')
        .select('id, stage, amount_minor, created_at, updated_at, currency')
        .not('stage', 'in', '("won","lost")'),
      
      // Tratos ganados en la ventana de tiempo
      db.from('deals')
        .select('id, amount_minor, currency, closed_at, updated_at')
        .eq('stage', 'won')
        .or(`closed_at.gte.${fromStr},and(closed_at.is.null,updated_at.gte.${fromStr})`),
      
      // Mensajes de outbound enviados
      db.from('crm_outbound_messages')
        .select('channel, template_key, template_variant, outcome, sent_at, metadata')
        .not('sent_at', 'is', null)
        .gte('sent_at', fromStr)
        .limit(5000)
    ]);

    // Verificación de errores de BD
    const dbError = activeRes.error || wonRes.error || outRes.error;
    if (dbError) {
      throw new Error(`Fallo en consulta de Revenue Ops: ${dbError.message}`);
    }

    const activeRows = (activeRes.data || []) as any[];
    const wonRows = (wonRes.data || []) as any[];
    const outboundRows = (outRes.data || []) as any[];

    // Alerta si el outbound llega al límite configurado
    if (outboundRows.length >= 5000) {
      await logEvent(
        'metrics.fallback_truncated',
        { requestId, eventCount: outboundRows.length, aggregator: 'revenue-ops' },
        { source: 'system' }
      );
    }

    // 4. Agregación de Pipeline por Etapa
    const stageMap = new Map<string, any>();
    for (const d of activeRows) {
      const stage = d.stage || 'unknown';
      const cur = stageMap.get(stage) ?? { stage, deals: 0, pipeline_minor: 0, total_age: 0, stale_over_7d: 0 };
      
      const createdAt = d.created_at ? new Date(d.created_at) : to;
      const updatedAt = d.updated_at ? new Date(d.updated_at) : createdAt;
      
      cur.deals += 1;
      cur.pipeline_minor += Number(d.amount_minor ?? 0);
      cur.total_age += Math.max(0, (to.getTime() - createdAt.getTime()) / 86400000);
      
      if ((to.getTime() - updatedAt.getTime()) / 86400000 > 7) {
        cur.stale_over_7d += 1;
      }
      
      stageMap.set(stage, cur);
    }

    const byStage = Array.from(stageMap.values())
      .map((r) => ({
        ...r,
        avg_age_days: r.deals ? r.total_age / r.deals : 0,
        total_age: undefined, // Limpieza de datos temporales
      }))
      .sort((a, b) => b.pipeline_minor - a.pipeline_minor);

    // 5. Rendimiento de Outbound y Plantillas
    const templateMap = new Map<string, any>();
    let sentCount = 0, repliedCount = 0, paidCount = 0;

    for (const o of outboundRows) {
      sentCount++;
      if (o.outcome === 'replied') repliedCount++;
      if (o.outcome === 'paid') paidCount++;

      const key = o.template_key || 'unknown';
      const variant = o.template_variant || 'A';
      const channel = o.channel || 'any';
      const meta = o.metadata || {};
      const locale = meta.locale || meta.lang || 'na';
      
      const k = `${key}||${locale}||${channel}||${variant}`;
      const cur = templateMap.get(k) ?? { key, locale, channel, variant, sent: 0, replied: 0, paid: 0 };
      
      cur.sent += 1;
      if (o.outcome === 'replied') cur.replied += 1;
      if (o.outcome === 'paid') cur.paid += 1;
      templateMap.set(k, cur);
    }

    const allTemplates = Array.from(templateMap.values()).map(r => ({
      ...r,
      reply_rate: r.sent ? r.replied / r.sent : 0,
      paid_rate: r.sent ? r.paid / r.sent : 0,
    }));

    // 6. Generación de Recomendaciones (Insights Accionables)
    const recommendations = [
      ...allTemplates
        .filter(r => r.sent >= 30 && r.paid_rate < 0.01)
        .sort((a, b) => a.paid_rate - b.paid_rate)
        .slice(0, 5)
        .map(r => ({
          type: 'template_underperformer',
          ...r,
          note: 'Bajo desempeño de cierre: considera ajustar el copy o la oferta principal.'
        })),
      ...allTemplates
        .filter(r => r.sent >= 30 && r.reply_rate >= 0.05 && r.paid_rate < 0.01)
        .slice(0, 5)
        .map(r => ({
          type: 'high_reply_low_paid',
          ...r,
          note: 'Alta interacción pero pocas ventas: revisa posibles fricciones en el checkout.'
        }))
    ].slice(0, 10);

    return NextResponse.json(
      {
        ok: true,
        window: { days, fromISO: iso(from), toISO: iso(to) },
        totals: {
          activeDeals: activeRows.length,
          pipeline_minor: activeRows.reduce((acc, d) => acc + Number(d.amount_minor ?? 0), 0),
          wonDeals: wonRows.length,
          won_minor: wonRows.reduce((acc, d) => acc + Number(d.amount_minor ?? 0), 0),
          sent: sentCount,
          replied: repliedCount,
          paid: paidCount,
          reply_rate: sentCount ? repliedCount / sentCount : 0,
          paid_rate: sentCount ? paidCount / sentCount : 0,
        },
        byStage,
        topTemplates: allTemplates.filter(t => t.sent >= 5).sort((a, b) => b.paid_rate - a.paid_rate).slice(0, 25),
        recommendations,
        requestId,
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido en Revenue Ops';
    
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/revenue-ops', message: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}