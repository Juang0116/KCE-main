import 'server-only';

import { logEvent } from '@/lib/events.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export type FiredAlert = {
  id?: string;
  type: string;
  severity: 'info' | 'warn' | 'critical';
  message: string;
  meta: Record<string, unknown>;
};

type AlertRule = {
  id: string;
  type: string;
  severity: 'info' | 'warn' | 'critical';
  params: any;
  is_enabled: boolean;
};

async function loadRules(): Promise<AlertRule[]> {
  const admin = getSupabaseAdmin();
  const res = await (admin as any).from('crm_alert_rules').select('id,type,severity,params,is_enabled').eq('is_enabled', true);
  if (res.error) return [];
  return (res.data ?? []) as AlertRule[];
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

async function hasRecentUnacked(type: string, cooldownMinutes: number, now: Date): Promise<boolean> {
  if (!cooldownMinutes || cooldownMinutes <= 0) return false;
  try {
    const admin = getSupabaseAdmin();
    const sinceIso = new Date(now.getTime() - cooldownMinutes * 60_000).toISOString();
    const res = await (admin as any)
      .from('crm_alerts')
      .select('id')
      .eq('type', type)
      .is('acknowledged_at', null)
      .gte('created_at', sinceIso)
      .limit(1);

    if (res?.error) return false;
    return (res.data ?? []).length > 0;
  } catch {
    // If the column doesn't exist yet (patch not applied), or any other issue, do not block firing.
    return false;
  }
}


async function evalFailedRateSpike(rule: AlertRule, now: Date): Promise<FiredAlert | null> {
  const params = rule.params ?? {};
  const windowMinutes = clamp(Number(params.window_minutes ?? 60), 10, 360);
  const minMessages = clamp(Number(params.min_messages ?? 20), 5, 5000);
  const threshold = clamp(Number(params.failed_rate_threshold ?? 0.25), 0.01, 0.95);

  const sinceIso = new Date(now.getTime() - windowMinutes * 60_000).toISOString();

  const admin = getSupabaseAdmin();
  const res = await (admin as any)
    .from('crm_outbound_messages')
    .select('id,channel,status,created_at')
    .gte('created_at', sinceIso);

  if (res.error) return null;
  const rows = res.data ?? [];
  if (rows.length < minMessages) return null;

  const byChannel = new Map<string, { total: number; failed: number }>();
  for (const r of rows) {
    const ch = String(r.channel || 'unknown');
    const status = String(r.status || '');
    const cur = byChannel.get(ch) ?? { total: 0, failed: 0 };
    cur.total += 1;
    if (status === 'failed') cur.failed += 1;
    byChannel.set(ch, cur);
  }

  const offenders: Array<{ channel: string; total: number; failed: number; rate: number }> = [];
  for (const [channel, v] of byChannel.entries()) {
    const rate = v.total ? v.failed / v.total : 0;
    if (v.total >= minMessages && rate >= threshold) offenders.push({ channel, ...v, rate });
  }
  if (offenders.length === 0) return null;

  offenders.sort((a, b) => b.rate - a.rate);

  const msg = `Outbound failed-rate spike in last ${windowMinutes}m: ` + offenders
    .slice(0, 3)
    .map((o) => `${o.channel} ${(o.rate * 100).toFixed(1)}% (${o.failed}/${o.total})`)
    .join(', ');

  return {
    type: 'failed_rate_spike',
    severity: rule.severity ?? 'critical',
    message: msg,
    meta: { windowMinutes, minMessages, threshold, offenders },
  };
}

async function evalPaidRateDrop(rule: AlertRule, now: Date): Promise<FiredAlert | null> {
  // Paid rate based on crm_outbound_messages: sent messages with attributed_won_at != null
  const params = rule.params ?? {};
  const windowHours = clamp(Number(params.window_hours ?? 24), 6, 168);
  const baselineDays = clamp(Number(params.baseline_days ?? 7), 3, 30);
  const minSent = clamp(Number(params.min_sent ?? 50), 20, 10000);
  const relDrop = clamp(Number(params.relative_drop_threshold ?? 0.30), 0.05, 0.90);

  const windowSince = new Date(now.getTime() - windowHours * 3600_000);
  const baselineSince = new Date(now.getTime() - baselineDays * 24 * 3600_000);

  const admin = getSupabaseAdmin();

  const current = await (admin as any)
    .from('crm_outbound_messages')
    .select('id,channel,sent_at,attributed_won_at,template_key,template_variant,created_at')
    .gte('created_at', windowSince.toISOString());

  if (current.error) return null;

  const baseline = await (admin as any)
    .from('crm_outbound_messages')
    .select('id,channel,sent_at,attributed_won_at,template_key,template_variant,created_at')
    .gte('created_at', baselineSince.toISOString())
    .lt('created_at', windowSince.toISOString());

  if (baseline.error) return null;

  const curRows = (current.data ?? []).filter((r: any) => r.sent_at);
  const baseRows = (baseline.data ?? []).filter((r: any) => r.sent_at);

  if (curRows.length < minSent || baseRows.length < minSent) return null;

  const curPaid = curRows.filter((r: any) => r.attributed_won_at).length;
  const basePaid = baseRows.filter((r: any) => r.attributed_won_at).length;

  const curRate = curPaid / curRows.length;
  const baseRate = basePaid / baseRows.length;

  if (baseRate <= 0) return null;

  const drop = (baseRate - curRate) / baseRate;
  if (drop < relDrop) return null;

  const msg =
    `Paid-rate drop: current ${(curRate * 100).toFixed(2)}% (${curPaid}/${curRows.length}) vs baseline ${(baseRate * 100).toFixed(2)}% (${basePaid}/${baseRows.length}) over last ${baselineDays}d (excluding last ${windowHours}h).`;

  return {
    type: 'paid_rate_drop',
    severity: rule.severity ?? 'warn',
    message: msg,
    meta: { windowHours, baselineDays, minSent, relDrop, cur: { sent: curRows.length, paid: curPaid, rate: curRate }, base: { sent: baseRows.length, paid: basePaid, rate: baseRate }, drop },
  };
}

async function insertAlert(alert: FiredAlert, dryRun: boolean): Promise<FiredAlert> {
  if (dryRun) return alert;
  const admin = getSupabaseAdmin();
  const res = await (admin as any).from('crm_alerts').insert({
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    meta: alert.meta,
  }).select('id').single();
  if (!res.error) alert.id = res.data?.id;
  return alert;
}

export async function evaluateAlerts(opts: { dryRun?: boolean; requestId?: string }): Promise<FiredAlert[]> {
  const now = new Date();
  const rules = await loadRules();
  const fired: FiredAlert[] = [];
  for (const rule of rules) {
    try {
      let a: FiredAlert | null = null;
      if (rule.type === 'failed_rate_spike') a = await evalFailedRateSpike(rule, now);
      if (rule.type === 'paid_rate_drop') a = await evalPaidRateDrop(rule, now);

      if (a) {
        const params = rule.params ?? {};
        const fallbackCooldown = a.type === 'paid_rate_drop' ? 360 : 60; // minutes
        const cooldownMinutes = clamp(Number(params.cooldown_minutes ?? fallbackCooldown), 0, 7 * 24 * 60);
        const blocked = await hasRecentUnacked(a.type, cooldownMinutes, now);
        if (!blocked) fired.push(await insertAlert(a, !!opts.dryRun));
      }
    } catch (e) {
      await logEvent('api.error', { requestId: opts.requestId ?? null, where: 'evaluateAlerts', error: String(e) });
    }
  }
  return fired;
}
