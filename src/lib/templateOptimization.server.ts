// src/lib/templateOptimization.server.ts
import 'server-only';

import { logEvent } from '@/lib/events.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRuntimeFlagBoolean } from '@/lib/runtimeFlags.server';

export type TemplateOptimizationParams = {
  requestId: string;
  days?: number;
  limit?: number;
  minSamples?: number;
  lockDays?: number;
  applyWeights?: boolean;
  source?: 'cron' | 'admin' | 'api';
};

type Stat = { sent: number; replied: number; paid: number };

type GroupKey = { key: string; channel: string; locale: string };

type Winner = {
  key: string;
  channel: string;
  locale: string;
  cohort: string;
  winnerVariant: string;
  sent: number;
  paidRate: number;
  repliedRate: number;
  lockUntilISO: string;
  reason: string;
};

function normalizeLocale(locale: any): 'es' | 'en' | 'de' | 'fr' {
  const l = String(locale ?? 'es').toLowerCase();
  if (l.startsWith('en')) return 'en';
  if (l.startsWith('de')) return 'de';
  if (l.startsWith('fr')) return 'fr';
  return 'es';
}

function isoWeekCohort(d: Date): string {
  // ISO week cohort: YYYY-Www
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((date.getTime() - yearStart.getTime()) / 86400000 / 7 + 1);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function pct(n: number) {
  return Number.isFinite(n) ? n : 0;
}

function nowISO() {
  return new Date().toISOString();
}

function addDaysISO(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

type VariantScore = {
  variant: string;
  sent: number;
  paidRate: number;
  replyRate: number;
};

function chooseWinner(
  variants: Record<string, Stat>,
  minSamples: number,
): { winner: string | null; reason: string; best?: VariantScore; second?: VariantScore } {
  const entries: VariantScore[] = Object.entries(variants)
    .map(([variant, s]) => ({
      variant: String(variant).toUpperCase(),
      sent: s.sent,
      paidRate: s.sent ? s.paid / s.sent : 0,
      replyRate: s.sent ? s.replied / s.sent : 0,
    }))
    .filter((e) => e.sent >= minSamples)
    .sort((a, b) => (b.paidRate - a.paidRate) || (b.sent - a.sent) || a.variant.localeCompare(b.variant));

  if (entries.length === 0) return { winner: null, reason: `insufficient_samples(<${minSamples})` };

  const best = entries[0]!;
  const second = entries[1];

  if (!second) return { winner: best.variant, reason: 'only_one_variant', best };

  // Hysteresis threshold: require a non-trivial margin to switch.
  // If paid rate differs by < 0.3pp, we consider it a tie.
  const margin = best.paidRate - second.paidRate;
  if (margin < 0.003) return { winner: best.variant, reason: 'tie_or_low_margin', best, second };

  return { winner: best.variant, reason: 'paid_rate_winner', best, second };
}

async function upsertLock(admin: any, w: Winner) {
  // Use best-effort upsert keyed by (key, locale, channel, cohort)
  const payload = {
    key: w.key,
    locale: w.locale,
    channel: w.channel,
    cohort: w.cohort,
    winner_variant: w.winnerVariant,
    sample_sent: w.sent,
    paid_rate: w.paidRate,
    computed_at: nowISO(),
    lock_until: w.lockUntilISO,
    meta: { reason: w.reason },
  };

  const res = await admin
    .from('crm_template_winner_locks')
    .upsert(payload, { onConflict: 'key,locale,channel,cohort' })
    .select('id')
    .maybeSingle();

  return res;
}

async function applyAutoWeights(admin: any, w: Winner) {
  const env = String(process.env.CRM_AUTO_PROMOTE_WEIGHTS ?? 'true').toLowerCase();
  const envEnabled = !(env === '0' || env === 'false' || env === 'off');
  const enabled = await getRuntimeFlagBoolean('crm_auto_promote_weights', envEnabled);
  if (!enabled) return { ok: false as const, skipped: 'disabled' as const };

  const winnerWeight = Math.max(3, Number(process.env.CRM_WINNER_WEIGHT ?? 5));
  const loserWeight = Math.max(1, Number(process.env.CRM_LOSER_WEIGHT ?? 1));

  // Only auto-adjust rows previously auto-adjusted OR rows still at default weights.
  const rowsRes = await admin
    .from('crm_templates')
    .select('id,variant,weight,weight_source')
    .eq('key', w.key)
    .eq('locale', w.locale)
    .in('channel', [w.channel, 'any']);

  if (rowsRes.error) return { ok: false as const, error: rowsRes.error.message };

  const rows = (rowsRes.data ?? []) as any[];
  const canAuto = rows.every((r) => String(r.weight_source ?? 'manual') === 'auto' || Number(r.weight ?? 1) === 1);
  if (!canAuto) return { ok: false as const, skipped: 'manual_weights_present' as const };

  const updates: Array<any> = [];
  for (const r of rows) {
    const v = String(r.variant ?? 'A').toUpperCase();
    updates.push({
      id: r.id,
      weight: v === w.winnerVariant ? winnerWeight : loserWeight,
      weight_source: 'auto',
      weight_updated_at: nowISO(),
    });
  }

  if (!updates.length) return { ok: false as const, skipped: 'no_rows' as const };

  const upd = await admin.from('crm_templates').upsert(updates, { onConflict: 'id' });
  if (upd.error) return { ok: false as const, error: upd.error.message };
  return { ok: true as const, updated: updates.length };
}

export async function runTemplateOptimization(
  params: TemplateOptimizationParams,
): Promise<{
  ok: boolean;
  winnersCreated: number;
  weightsUpdated: number;
  skipped: number;
  winners: Winner[];
  requestId: string;
}> {
  const requestId = params.requestId;
  const days = Math.max(7, Math.min(180, params.days ?? 30));
  const limit = Math.max(500, Math.min(15000, params.limit ?? 8000));
  const minSamples = Math.max(10, Math.min(500, params.minSamples ?? 40));
  const lockDays = Math.max(3, Math.min(21, params.lockDays ?? 7));
  const applyWeights = params.applyWeights ?? true;
  const source = params.source ?? 'api';

  const admin = getSupabaseAdmin();
  if (!admin) {
    await logEvent(
      'crm.template_optimization_error',
      { requestId, reason: 'supabase_admin_not_configured' },
      { source },
    );
    return { ok: false, winnersCreated: 0, weightsUpdated: 0, skipped: 0, winners: [], requestId };
  }

  const sinceISO = new Date(Date.now() - days * 86400000).toISOString();

  const outRes = await admin
    .from('crm_outbound_messages')
    .select('template_key,template_variant,channel,outcome,sent_at,metadata,status')
    .eq('status', 'sent')
    .gte('sent_at', sinceISO)
    .limit(limit);

  if (outRes.error) {
    await logEvent(
      'crm.template_optimization_error',
      { requestId, reason: 'query_failed', message: outRes.error.message },
      { source },
    );
    return { ok: false, winnersCreated: 0, weightsUpdated: 0, skipped: 0, winners: [], requestId };
  }

  const byGroup: Record<string, { g: GroupKey; variants: Record<string, Stat> }> = {};

  for (const row of (outRes.data ?? []) as any[]) {
    const key = String(row.template_key ?? '').trim();
    if (!key) continue;

    const variant = String(row.template_variant ?? 'A').toUpperCase();
    const channel = String(row.channel ?? 'any');
    const locale = normalizeLocale(row.metadata?.locale ?? row.metadata?.lang);

    const groupKey = `${key}|${channel}|${locale}`;
    byGroup[groupKey] ||= { g: { key, channel, locale }, variants: {} };
    byGroup[groupKey].variants[variant] ||= { sent: 0, replied: 0, paid: 0 };

    byGroup[groupKey].variants[variant].sent += 1;
    if (String(row.outcome) === 'replied') byGroup[groupKey].variants[variant].replied += 1;
    if (String(row.outcome) === 'paid') byGroup[groupKey].variants[variant].paid += 1;
  }

  const cohort = isoWeekCohort(new Date());

  const winners: Winner[] = [];
  let winnersCreated = 0;
  let weightsUpdated = 0;
  let skipped = 0;

  for (const { g, variants } of Object.values(byGroup)) {
    const pick = chooseWinner(variants, minSamples);
    if (!pick.winner) {
      skipped += 1;
      continue;
    }

    const s = variants[pick.winner] || { sent: 0, replied: 0, paid: 0 };
    const paidRate = s.sent ? s.paid / s.sent : 0;
    const repliedRate = s.sent ? s.replied / s.sent : 0;

    const w: Winner = {
      key: g.key,
      channel: g.channel,
      locale: g.locale,
      cohort,
      winnerVariant: pick.winner,
      sent: s.sent,
      paidRate: pct(paidRate),
      repliedRate: pct(repliedRate),
      lockUntilISO: addDaysISO(lockDays),
      reason: pick.reason,
    };

    const lockRes = await upsertLock(admin as any, w);
    if (lockRes.error) {
      skipped += 1;
      continue;
    }

    winnersCreated += 1;
    winners.push(w);

    if (applyWeights) {
      const wr = await applyAutoWeights(admin as any, w);
      if (wr.ok) weightsUpdated += Number((wr as any).updated ?? 0);
    }
  }

  await logEvent(
    source === 'cron' ? 'crm.template_optimization_cron' : 'crm.template_optimization',
    { requestId, days, limit, minSamples, cohort, winnersCreated, weightsUpdated, skipped },
    { source },
  );

  return { ok: true, winnersCreated, weightsUpdated, skipped, winners, requestId };
}
