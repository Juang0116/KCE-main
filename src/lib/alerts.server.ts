// src/lib/alerts.server.ts
import 'server-only';

import { logEvent } from '@/lib/events.server';
import { getSupabaseAdminAny } from '@/lib/supabaseAdminAny.server';

type Rule = {
  id: string;
  key: string;
  scope: string;
  channel: string | null;
  locale: string | null;
  metric: string;
  window_days: number;
  threshold_drop: number | null;
  threshold_rate: number | null;
  min_sent: number;
  severity: string;
  enabled: boolean;
};

type OutboundRow = {
  channel: string;
  status: string;
  outcome: string;
  sent_at: string | null;
  metadata: any;
};

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function isoAtDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function getLocaleFromMeta(meta: any): string | null {
  const v = meta?.locale ?? meta?.lang ?? null;
  if (!v) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function rate(num: number, den: number): number {
  return den > 0 ? num / den : 0;
}

export type FiredAlert = {
  ruleId?: string;
  key: string;
  scope: string;
  channel?: string | null;
  locale?: string | null;
  metric: string;
  severity: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  firedAtISO?: string;
};

async function fetchRules(): Promise<Rule[]> {
  const sb = getSupabaseAdminAny();
  const { data, error } = await sb
    .from('crm_alert_rules')
    .select('id,key,scope,channel,locale,metric,window_days,threshold_drop,threshold_rate,min_sent,severity,enabled')
    .eq('enabled', true);

  if (error || !data) return [];
  return data as Rule[];
}

async function fetchOutboundForWindow(fromISO: string, toISO: string): Promise<OutboundRow[]> {
  const sb = getSupabaseAdminAny();
  // best-effort: we only need a slice for aggregate rates; limit protects accidental big scans
  const { data, error } = await sb
    .from('crm_outbound_messages')
    .select('channel,status,outcome,sent_at,metadata')
    .gte('created_at', fromISO)
    .lt('created_at', toISO)
    .limit(20000);

  if (error || !data) return [];
  return data as OutboundRow[];
}

function filterRows(rows: OutboundRow[], rule: Rule): OutboundRow[] {
  return rows.filter((r) => {
    if (rule.channel && r.channel !== rule.channel) return false;
    if (rule.locale) {
      const loc = getLocaleFromMeta(r.metadata);
      if (loc !== rule.locale) return false;
    }
    return true;
  });
}

function computePaidRate(rows: OutboundRow[]): { sent: number; paid: number; paidRate: number } {
  let sent = 0;
  let paid = 0;
  for (const r of rows) {
    if (r.status === 'sent' && r.sent_at) sent += 1;
    if (r.outcome === 'paid') paid += 1;
  }
  return { sent, paid, paidRate: clamp01(rate(paid, sent)) };
}

function computeFailedRate(rows: OutboundRow[]): { attempted: number; failed: number; failedRate: number } {
  let attempted = 0;
  let failed = 0;
  for (const r of rows) {
    // attempted = sent or failed (ignore drafts)
    if (r.status === 'sent' || r.status === 'failed') attempted += 1;
    if (r.status === 'failed') failed += 1;
  }
  return { attempted, failed, failedRate: clamp01(rate(failed, attempted)) };
}

async function insertAlert(alert: FiredAlert, ruleId?: string) {
  const sb = getSupabaseAdminAny();
  const { error } = await sb.from('crm_alerts').insert({
    rule_id: ruleId ?? null,
    key: alert.key,
    scope: alert.scope,
    channel: alert.channel ?? null,
    locale: alert.locale ?? null,
    metric: alert.metric,
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    data: alert.data as any,
  });

  // also log as event (best-effort)
  await logEvent(
    'crm.alert.fired',
    { ...alert, ruleId: ruleId ?? null },
    {
      source: 'alerts',
      dedupeKey: `alert:${alert.metric}:${alert.key}:${alert.channel ?? ''}:${alert.locale ?? ''}:${String(
        (alert.data as any)?.window ?? '',
      )}`,
    },
  );

  return !error;
}

export async function runAlerting(params: {
  daysBack?: number;
  requestId: string;
  dryRun?: boolean;
}): Promise<{ ok: boolean; alerts: FiredAlert[] }> {
  const rules = await fetchRules();
  if (!rules.length) return { ok: true, alerts: [] };

  const alerts: FiredAlert[] = [];
  for (const rule of rules) {
    const w = Math.max(1, Math.min(30, rule.window_days || 7));
    const nowISO = new Date().toISOString();
    const curFrom = isoAtDaysAgo(w);
    const prevFrom = isoAtDaysAgo(w * 2);

    const prevRowsAll = await fetchOutboundForWindow(prevFrom, curFrom);
    const curRowsAll = await fetchOutboundForWindow(curFrom, nowISO);

    const prevRows = filterRows(prevRowsAll, rule);
    const curRows = filterRows(curRowsAll, rule);

    if (rule.metric === 'paid_rate_drop') {
      const prev = computePaidRate(prevRows);
      const cur = computePaidRate(curRows);
      if (prev.sent >= rule.min_sent && cur.sent >= rule.min_sent && prev.paidRate > 0) {
        const dropRel = (prev.paidRate - cur.paidRate) / prev.paidRate;
        const th = rule.threshold_drop ?? 0.30;
        if (dropRel >= th) {
          alerts.push({
            ruleId: rule.id,
            key: rule.key,
            scope: rule.scope,
            channel: rule.channel,
            locale: rule.locale,
            metric: rule.metric,
            severity: rule.severity || 'warn',
            title: 'Paid rate cayó',
            message: `Paid rate cayó ${(dropRel * 100).toFixed(0)}% (prev ${(prev.paidRate * 100).toFixed(
              1,
            )}% → ahora ${(cur.paidRate * 100).toFixed(1)}%), sent=${cur.sent}.`,
            data: {
              window: `${w}d`,
              prev: { sent: prev.sent, paid: prev.paid, paidRate: prev.paidRate },
              cur: { sent: cur.sent, paid: cur.paid, paidRate: cur.paidRate },
              dropRel,
            },
          });
        }
      }
    } else if (rule.metric === 'failed_rate_spike') {
      const cur = computeFailedRate(curRows);
      if (cur.attempted >= rule.min_sent) {
        const th = rule.threshold_rate ?? 0.12;
        if (cur.failedRate >= th) {
          alerts.push({
            ruleId: rule.id,
            key: rule.key,
            scope: rule.scope,
            channel: rule.channel,
            locale: rule.locale,
            metric: rule.metric,
            severity: rule.severity || 'critical',
            title: 'Spike de fallos de envío',
            message: `Failed rate ${(cur.failedRate * 100).toFixed(1)}% (failed=${cur.failed}/${cur.attempted}) en ventana ${w}d.`,
            data: { window: `${w}d`, cur },
          });
        }
      }
    }
  }

  if (!params.dryRun) {
    for (const a of alerts) await insertAlert(a, a.ruleId);
  }

  return { ok: true, alerts };
}

export async function getRecentAlerts(days: number): Promise<FiredAlert[]> {
  const sb = getSupabaseAdminAny();
  const fromISO = isoAtDaysAgo(Math.max(1, Math.min(90, days)));
  const { data, error } = await sb
    .from('crm_alerts')
    .select('rule_id,key,scope,channel,locale,metric,severity,title,message,data,fired_at')
    .gte('fired_at', fromISO)
    .order('fired_at', { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    ruleId: r.rule_id ?? undefined,
    key: r.key,
    scope: r.scope,
    channel: r.channel,
    locale: r.locale,
    metric: r.metric,
    severity: r.severity,
    title: r.title,
    message: r.message,
    data: r.data ?? {},
    firedAtISO: r.fired_at,
  }));
}
