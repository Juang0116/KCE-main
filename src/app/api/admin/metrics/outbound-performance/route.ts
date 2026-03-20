// src/app/api/admin/metrics/outbound-performance/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Esquema de validación tolerante a parámetros extra
const QuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
  limit: z.coerce.number().int().min(50).max(5000).default(1000),
});

export async function GET(req: NextRequest) {
  // 2. Autenticación y configuración inicial
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const admin = getSupabaseAdmin();

  // Validación de seguridad de entorno
  if (!admin) {
    return NextResponse.json(
      { error: 'Cliente Supabase de administrador no configurado', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) }
    );
  }

  try {
    // 3. Parseo y validación segura de URL
    const parsed = QuerySchema.safeParse({
      days: req.nextUrl.searchParams.get('days') ?? undefined,
      limit: req.nextUrl.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) }
      );
    }

    const { days, limit } = parsed.data;
    const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const db = admin as any; // Workaround temporal para tipos

    // 4. Extracción de Mensajes Salientes
    const msgs = await db
      .from('crm_outbound_messages')
      .select('id, deal_id, channel, status, template_key, template_variant, created_at, sent_at, outcome, replied_at, attributed_won_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (msgs.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/metrics/outbound-performance', message: msgs.error.message },
        { source: 'api' }
      );
      return NextResponse.json(
        { error: 'Error en la base de datos al consultar el rendimiento outbound', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) }
      );
    }

    const rows = (msgs.data || []) as any[];

    // Alerta de escalabilidad si llegamos al tope del límite
    if (rows.length >= limit) {
      await logEvent(
        'metrics.fallback_truncated',
        { requestId, eventCount: rows.length, aggregator: 'outbound-performance' },
        { source: 'system' }
      );
    }

    // 5. Enriquecimiento: Cruzar mensajes con sus tratos (Deals) correspondientes
    const dealIds = Array.from(new Set(rows.map((r) => r.deal_id).filter(Boolean)));
    const dealsMap = new Map<string, any>();
    
    if (dealIds.length > 0) {
      const deals = await db
        .from('deals')
        .select('id, stage, closed_at, updated_at')
        .in('id', dealIds);

      if (deals.error) {
         // Log the non-fatal error but continue processing what we have
         await logEvent(
          'api.warning',
          { requestId, route: 'outbound-performance', message: `Fallo cruzando deals: ${deals.error.message}` },
          { source: 'api' }
        );
      } else {
        for (const d of deals.data || []) {
          dealsMap.set(d.id, d);
        }
      }
    }

    // 6. Agregación y Cálculo de Conversión O(N)
    type AggRow = { 
      key: string; 
      variant: string | null; 
      channel: string; 
      sent: number; 
      failed: number; 
      queued: number; 
      replied: number; 
      paid: number; 
      won7d: number 
    };
    
    const agg = new Map<string, AggRow>();

    for (const r of rows) {
      // Clave compuesta para separar por plantilla, variante A/B y canal (email/whatsapp)
      const templateKey = r.template_key || 'none';
      const variantKey = r.template_variant || '';
      const channelKey = r.channel || 'unknown';
      const k = `${templateKey}|${variantKey}|${channelKey}`;
      
      const cur = agg.get(k) || {
          key: templateKey,
          variant: r.template_variant || null,
          channel: channelKey,
          sent: 0,
          failed: 0,
          queued: 0,
          replied: 0,
          paid: 0,
          won7d: 0,
        };

      // Clasificación por estado
      if (r.status === 'sent') cur.sent++;
      else if (r.status === 'failed') cur.failed++;
      else if (r.status === 'queued' || r.status === 'sending') cur.queued++;

      // Clasificación por resultado directo
      if (r.outcome === 'replied') cur.replied++;
      if (r.outcome === 'paid') cur.paid++;

      // Clasificación de Impacto de Negocio: Deal ganado (Won) dentro de 7 días del envío
      const deal = r.deal_id ? dealsMap.get(r.deal_id) : null;
      if (r.status === 'sent' && r.sent_at && deal?.stage === 'won' && deal?.closed_at) {
        const sentTime = new Date(r.sent_at).getTime();
        const closedTime = new Date(deal.closed_at).getTime();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        
        if (closedTime >= sentTime && closedTime <= (sentTime + sevenDaysMs)) {
          cur.won7d++;
        }
      }

      agg.set(k, cur);
    }

    // 7. Ordenar por volumen (enviados + encolados) y enviar respuesta
    const items = Array.from(agg.values()).sort((a, b) => (b.sent + b.queued) - (a.sent + a.queued));

    return NextResponse.json(
      {
        ok: true,
        requestId,
        window: { from: sinceIso, to: new Date().toISOString() },
        items,
      },
      { status: 200, headers: withRequestId(undefined, requestId) }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al calcular el rendimiento outbound';
    
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/outbound-performance', message: errorMessage },
      { source: 'api' }
    );
    
    return NextResponse.json(
      { error: 'Error inesperado del servidor', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) }
    );
  }
}