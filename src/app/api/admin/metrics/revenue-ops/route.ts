// src/app/api/admin/metrics/revenue-ops/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

const QuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(180).default(30),
});

function iso(d: Date) {
  return d.toISOString();
}

function daysBetween(a: Date, b: Date) {
  return (a.getTime() - b.getTime()) / 86400000;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({ days: url.searchParams.get('days') ?? undefined });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const days = parsed.data.days;
    const to = new Date();
    const from = new Date(to.getTime() - days * 86400000);

    const admin = getSupabaseAdmin();

    // Active pipeline deals (stage not won/lost)
    const activeRes = await (admin as any)
      .from('deals')
      .select('id,stage,amount_minor,created_at,updated_at,currency')
      .not('stage', 'in', '("won","lost")');

    if (activeRes.error) {
      await logEvent('api.error', { requestId, route: '/api/admin/metrics/revenue-ops', message: activeRes.error.message }, { source: 'api' });
      return NextResponse.json({ error: 'DB error (deals)', requestId }, { status: 500, headers: withRequestId(undefined, requestId) });
    }

    // Won deals in window (closed_at if available, else updated_at)
    const wonRes = await (admin as any)
      .from('deals')
      .select('id,amount_minor,currency,closed_at,updated_at')
      .eq('stage', 'won')
      .or(`closed_at.gte.${iso(from)},and(closed_at.is.null,updated_at.gte.${iso(from)})`);

    if (wonRes.error) {
      await logEvent('api.error', { requestId, route: '/api/admin/metrics/revenue-ops', message: wonRes.error.message }, { source: 'api' });
      return NextResponse.json({ error: 'DB error (won)', requestId }, { status: 500, headers: withRequestId(undefined, requestId) });
    }

    // Outbound messages sent in window
    const outRes = await (admin as any)
      .from('crm_outbound_messages')
      .select('channel,template_key,template_variant,outcome,sent_at,metadata')
      .not('sent_at', 'is', null)
      .gte('sent_at', iso(from))
      .limit(5000);

    if (outRes.error) {
      await logEvent('api.error', { requestId, route: '/api/admin/metrics/revenue-ops', message: outRes.error.message }, { source: 'api' });
      return NextResponse.json({ error: 'DB error (outbound)', requestId }, { status: 500, headers: withRequestId(undefined, requestId) });
    }

    const active = (activeRes.data ?? []) as Array<any>;
    const won = (wonRes.data ?? []) as Array<any>;
    const outbound = (outRes.data ?? []) as Array<any>;

    // Stage aggregation
    const stageMap = new Map<string, { stage: string; deals: number; pipeline_minor: number; ages: number[]; stale_over_7d: number }>();
    for (const d of active) {
      const stage = String(d.stage || 'unknown');
      const m = stageMap.get(stage) ?? { stage, deals: 0, pipeline_minor: 0, ages: [], stale_over_7d: 0 };
      m.deals += 1;
      m.pipeline_minor += Number(d.amount_minor ?? 0);
      const createdAt = d.created_at ? new Date(d.created_at) : to;
      const updatedAt = d.updated_at ? new Date(d.updated_at) : createdAt;
      m.ages.push(Math.max(0, daysBetween(to, createdAt)));
      if (daysBetween(to, updatedAt) > 7) m.stale_over_7d += 1;
      stageMap.set(stage, m);
    }

    const byStage = Array.from(stageMap.values())
      .map((r) => ({
        stage: r.stage,
        deals: r.deals,
        pipeline_minor: r.pipeline_minor,
        avg_age_days: r.ages.length ? r.ages.reduce((a, b) => a + b, 0) / r.ages.length : 0,
        stale_over_7d: r.stale_over_7d,
      }))
      .sort((a, b) => b.pipeline_minor - a.pipeline_minor);

    const pipeline_minor = active.reduce((s, d) => s + Number(d.amount_minor ?? 0), 0);
    const won_minor = won.reduce((s, d) => s + Number(d.amount_minor ?? 0), 0);

    // Outbound totals
    const sent = outbound.length;
    const replied = outbound.filter((o) => String(o.outcome) === 'replied').length;
    const paid = outbound.filter((o) => String(o.outcome) === 'paid').length;

    // Template aggregation (top 25 by paid_rate, min sent 5)
    type Key = string;
    const tmap = new Map<Key, { key: string; locale: string; channel: string; variant: string; sent: number; replied: number; paid: number }>();
    for (const o of outbound) {
      const key = String(o.template_key ?? 'unknown');
      const variant = String(o.template_variant ?? 'A');
      const channel = String(o.channel ?? 'any');
      const meta = (o.metadata ?? {}) as any;
      const locale = String(meta.locale ?? meta.lang ?? 'na');
      const k = `${key}||${locale}||${channel}||${variant}`;
      const cur = tmap.get(k) ?? { key, locale, channel, variant, sent: 0, replied: 0, paid: 0 };
      cur.sent += 1;
      if (String(o.outcome) === 'replied') cur.replied += 1;
      if (String(o.outcome) === 'paid') cur.paid += 1;
      tmap.set(k, cur);
    }

    const topTemplates = Array.from(tmap.values())
      .map((r) => ({
        ...r,
        reply_rate: r.sent ? r.replied / r.sent : 0,
        paid_rate: r.sent ? r.paid / r.sent : 0,
      }))
      .filter((r) => r.sent >= 5)
      .sort((a, b) => b.paid_rate - a.paid_rate)
      .slice(0, 25);

const allTemplates = Array.from(tmap.values())
  .map((r) => ({
    ...r,
    reply_rate: r.sent ? r.replied / r.sent : 0,
    paid_rate: r.sent ? r.paid / r.sent : 0,
  }))
  .filter((r) => r.sent >= 10);

const underperformers = [...allTemplates]
  .filter((r) => r.sent >= 30)
  .sort((a, b) => (a.paid_rate - b.paid_rate) || (a.reply_rate - b.reply_rate) || (b.sent - a.sent))
  .slice(0, 5)
  .map((r) => ({
    type: 'template_underperformer' as const,
    key: r.key,
    locale: r.locale,
    channel: r.channel,
    variant: r.variant,
    sent: r.sent,
    reply_rate: r.reply_rate,
    paid_rate: r.paid_rate,
    note: 'Bajo desempeño: considera ajustar copy/CTA u ofrecer incentivo.',
  }));

const highReplyLowPaid = [...allTemplates]
  .filter((r) => r.sent >= 30 && r.reply_rate >= 0.05 && r.paid_rate < 0.01)
  .sort((a, b) => (b.reply_rate - a.reply_rate) || (a.paid_rate - b.paid_rate) || (b.sent - a.sent))
  .slice(0, 5)
  .map((r) => ({
    type: 'high_reply_low_paid' as const,
    key: r.key,
    locale: r.locale,
    channel: r.channel,
    variant: r.variant,
    sent: r.sent,
    reply_rate: r.reply_rate,
    paid_rate: r.paid_rate,
    note: 'Buenas respuestas pero pocas compras: revisa fricción en checkout y follow-ups.',
  }));

const recommendations = [...underperformers, ...highReplyLowPaid].slice(0, 10);


    return NextResponse.json(
      {
        window: { days, fromISO: iso(from), toISO: iso(to) },
        totals: {
          activeDeals: active.length,
          pipeline_minor,
          wonDeals: won.length,
          won_minor,
          sent,
          replied,
          paid,
          reply_rate: sent ? replied / sent : 0,
          paid_rate: sent ? paid / sent : 0,
        },
        byStage,
        topTemplates,
        recommendations,
        requestId,
      },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: any) {
    await logEvent('api.error', { requestId, route: '/api/admin/metrics/revenue-ops', message: e?.message || String(e) }, { source: 'api' });
    return NextResponse.json({ error: 'Unexpected error', requestId }, { status: 500, headers: withRequestId(undefined, requestId) });
  }
}
