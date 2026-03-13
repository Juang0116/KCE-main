import 'server-only';

import { createOutboundMessage } from '@/lib/outbound.server';
import { logEvent } from '@/lib/events.server';
import { renderCrmTemplate } from '@/lib/templates.server';
import { buildTrackedCheckoutUrl } from '@/lib/checkoutTracking.server';
import { getSupabaseAdminAny } from '@/lib/supabaseAdminAny.server';

type SkippedCounters = {
  missing_checkout: number;
  missing_started_at: number;
  outside_window: number;
  not_due: number;
  lock_conflict: number;
  lock_failed: number;
  rate_limited: number;
  incentive_insert_failed: number;
  dry_run: number;
};

function isoWeekCohort(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const year = date.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

function daysSince(iso: string, now = new Date()): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  const ms = now.getTime() - d.getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreDeal(row: any): number {
  const stage = String(row?.stage || '').toLowerCase();
  let score = 25;
  if (stage === 'checkout') score = 75;
  else if (stage === 'proposal') score = 60;
  else if (stage === 'qualified') score = 45;
  else if (stage === 'contacted') score = 35;
  else if (stage === 'new') score = 30;

  const prob = Number(row?.probability ?? 0) || 0;
  score += clamp(Math.round(prob / 10), 0, 10);

  if (Number(row?.amount_minor ?? 0) > 0) score += 5;

  const opened = Boolean(row?.checkout_opened_at);
  if (!opened) score += 5;

  const updatedAt = row?.updated_at ? String(row.updated_at) : null;
  if (updatedAt) {
    const st = daysSince(updatedAt);
    if (st >= 2) score -= 10;
    if (st >= 5) score -= 10;
  }

  return clamp(score, 0, 100);
}

async function canUseIncentive(
  admin: any,
  args: { dealId: string; cohort: string; minScore: number; score: number },
) {
  if (args.score < args.minScore) return { ok: false as const, reason: 'low_score' as const };

  const enabled = String(process.env.CRM_INCENTIVES_ENABLED || 'true').toLowerCase() !== 'false';
  if (!enabled) return { ok: false as const, reason: 'disabled' as const };

  const cap = Number(process.env.CRM_INCENTIVES_MAX_PER_DAY || '25');
  const dayKey = new Date().toISOString().slice(0, 10);
  const since = `${dayKey}T00:00:00.000Z`;

  const countRes = await admin
    .from('crm_incentives')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since);

  const used = Number((countRes as any)?.count ?? 0) || 0;
  if (used >= cap) return { ok: false as const, reason: 'daily_cap' as const };

  // One incentive per deal+cohort
  const existing = await admin
    .from('crm_incentives')
    .select('id', { head: true })
    .eq('deal_id', args.dealId)
    .eq('cohort', args.cohort)
    .eq('kind', 'checkout')
    .limit(1);

  // best-effort
  if (!existing.error && (existing.data?.length || 0) > 0) {
    return { ok: false as const, reason: 'already_used' as const };
  }

  return { ok: true as const };
}

function pickIncentiveText(score: number, locale: string) {
  const expiresHours = Number(process.env.CRM_INCENTIVE_EXPIRES_HOURS || '24');
  const expiresAt = new Date(Date.now() + Math.max(1, expiresHours) * 3600 * 1000).toISOString();

  const l = (locale || 'es').toLowerCase();
  const hot = score >= 90;

  if (l.startsWith('en')) {
    return {
      incentive_line: hot
        ? '🎁 Bonus (24h): we can include a small extra (priority support / quick itinerary tweak).'
        : '🎁 Bonus (24h): we can include a small extra to help you confirm faster.',
      expires_at: expiresAt,
    };
  }

  if (l.startsWith('de')) {
    return {
      incentive_line: hot
        ? '🎁 Bonus (24h): kleines Extra möglich (Prioritäts-Support / kurzer Itinerary-Feinschliff).'
        : '🎁 Bonus (24h): kleines Extra, damit du schneller bestätigen kannst.',
      expires_at: expiresAt,
    };
  }

  return {
    incentive_line: hot
      ? '🎁 Bonus (24h): te incluyo un extra pequeño (soporte prioritario / ajuste rápido del itinerario).'
      : '🎁 Bonus (24h): te incluyo un extra pequeño para ayudarte a confirmar más rápido.',
    expires_at: expiresAt,
  };
}

async function acquireFollowupLock(
  admin: any,
  args: { dealId: string; cohort: string; kind: 'checkout_d1' | 'checkout_d3' },
) {
  const insert = { deal_id: args.dealId, cohort: args.cohort, kind: args.kind };

  const res = await admin
    .from('crm_followup_locks')
    .insert(insert as any)
    .select('id')
    .maybeSingle();

  if (!res.error && res.data?.id) return { ok: true as const, lockId: res.data.id as number };

  const msg = String((res.error as any)?.message || '').toLowerCase();
  const conflict =
    msg.includes('duplicate') ||
    msg.includes('unique') ||
    msg.includes('violates unique') ||
    msg.includes('already exists');

  if (conflict) return { ok: false as const, reason: 'already_locked' as const };
  return { ok: false as const, reason: 'insert_failed' as const, error: res.error };
}

export async function runCheckoutCohortFollowups(args: {
  requestId: string;
  limit?: number;
  dryRun?: boolean;
  source?: 'cron' | 'manual';
}): Promise<{
  processed: number;
  queued: number;
  skipped: SkippedCounters;
}> {
  const admin = getSupabaseAdminAny();

  const limit = Math.min(Math.max(args.limit ?? 400, 10), 2000);
  const dryRun = Boolean(args.dryRun);

  const d1 = 1;
  const d3 = 3;
  const maxWindowDays = Number(process.env.CRM_FOLLOWUP_MAX_WINDOW_DAYS || '10');

  const res = await admin
    .from('deals')
    .select(
      'id,stage,checkout_url,stripe_session_id,checkout_started_at,checkout_opened_at,updated_at,closed_at,amount_minor,currency,probability,title,tour_slug,lead_id,customer_id,leads(email,whatsapp,first_name,last_name),customers(name,email,phone,country)',
    )
    .eq('stage', 'checkout')
    .is('closed_at', null)
    .order('updated_at', { ascending: true })
    .limit(limit);

  if (res.error) throw new Error(res.error.message);
  const rows: any[] = (res.data || []) as any[];

  const skipped: SkippedCounters = {
    missing_checkout: 0,
    missing_started_at: 0,
    outside_window: 0,
    not_due: 0,
    lock_conflict: 0,
    lock_failed: 0,
    rate_limited: 0,
    incentive_insert_failed: 0,
    dry_run: 0,
  };

  let processed = 0;
  let queued = 0;

  for (const d of rows) {
    processed++;

    const dealId = String(d.id);
    const startedAt = d.checkout_started_at
      ? String(d.checkout_started_at)
      : d.updated_at
        ? String(d.updated_at)
        : null;

    if (!startedAt) {
      skipped.missing_started_at++;
      continue;
    }

    const ageDays = daysSince(startedAt);
    if (ageDays > maxWindowDays) {
      skipped.outside_window++;
      continue;
    }

    if (!d.checkout_url || !d.stripe_session_id) {
      skipped.missing_checkout++;
      continue;
    }

    const cohort = isoWeekCohort(new Date(startedAt));

    let kind: 'checkout_d1' | 'checkout_d3' | null = null;
    if (ageDays >= d1 && ageDays < d3) kind = 'checkout_d1';
    else if (ageDays >= d3) kind = 'checkout_d3';

    if (!kind) {
      skipped.not_due++;
      continue;
    }

    const lock = await acquireFollowupLock(admin as any, { dealId, cohort, kind });
    if (!lock.ok) {
      if (lock.reason === 'already_locked') skipped.lock_conflict++;
      else skipped.lock_failed++;
      continue;
    }

    const minIntervalHours = Number(process.env.CRM_OUTBOUND_MIN_INTERVAL_HOURS || '8');
    const sinceMin = new Date(Date.now() - minIntervalHours * 3600 * 1000).toISOString();

    const recent = await admin
      .from('crm_outbound_messages')
      .select('id', { head: true })
      .eq('deal_id', dealId)
      .gte('created_at', sinceMin)
      .in('status', ['queued', 'sending', 'sent'])
      .limit(1);

    if (!recent.error && (recent.data?.length || 0) > 0) {
      skipped.rate_limited++;
      continue;
    }

    const lead = (d as any).leads ?? null;
    const customer = (d as any).customers ?? null;

    const name =
      (customer?.name as string | null) ||
      (lead ? [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || null : null) ||
      null;

    const email = (customer?.email as string | null) || (lead?.email as string | null) || null;
    const phone = (lead?.whatsapp as string | null) || (customer?.phone as string | null) || null;

    const locale = 'es';
    const score = scoreDeal(d);

    const tracked =
      buildTrackedCheckoutUrl({ dealId, stripeSessionId: String(d.stripe_session_id) }) ||
      String(d.checkout_url);

    let incentive_line = '';
    let incentive_expires_at: string | null = null;

    const minScore = Number(process.env.CRM_INCENTIVE_MIN_SCORE || '85');
    const incentiveOk = await canUseIncentive(admin as any, { dealId, cohort, minScore, score });

    if (incentiveOk.ok) {
      const picked = pickIncentiveText(score, locale);
      incentive_line = picked.incentive_line;
      incentive_expires_at = picked.expires_at;

      if (!dryRun) {
        const ins = await admin.from('crm_incentives').insert({
          deal_id: dealId,
          cohort,
          kind: 'checkout',
          incentive: incentive_line,
          expires_at: incentive_expires_at,
        } as any);

        if (ins.error) skipped.incentive_insert_failed++;
      }
    }

    const templateKey =
      kind === 'checkout_d1' ? 'deal.followup.checkout_d1' : 'deal.followup.checkout_d3';

    const channel = phone ? 'whatsapp' : 'email';

    const rendered = await renderCrmTemplate({
      key: templateKey,
      locale,
      channel,
      vars: {
        name: name || 'amigo',
        tour: String(d.title || d.tour_slug || 'tu tour'),
        checkout_url: tracked,
        incentive_line: incentive_line || '',
        incentive_expiry: incentive_expires_at || '',
      },
      seed: `${dealId}|${cohort}|${kind}`,
      preferWinner: true,
    });

    if (dryRun) {
      skipped.dry_run++;
      continue;
    }

    if (channel === 'whatsapp' && !phone) {
      skipped.missing_checkout++;
      continue;
    }
    if (channel === 'email' && !email) {
      skipped.missing_checkout++;
      continue;
    }

    const msg = await createOutboundMessage({
      channel,
      provider: 'autopilot',
      status: 'queued',
      toEmail: channel === 'email' ? email : null,
      toPhone: channel === 'whatsapp' ? phone : null,
      subject: rendered.subject,
      body: rendered.body,
      dealId,
      templateKey,
      templateVariant: rendered.templateVariant ?? null,
      metadata: {
        trigger: 'conversion.followup',
        followup_kind: kind,
        cohort,
        locale,
        score,
        requestId: args.requestId,
        source: args.source ?? 'cron',
      },
    });

    queued++;

    try {
      await admin
        .from('crm_followup_locks')
        .update({ sent_message_id: msg.id } as any)
        .eq('id', lock.lockId);
    } catch {
      // ignore
    }

    await logEvent(
      'crm.followup.queued',
      {
        requestId: args.requestId,
        dealId,
        templateKey,
        kind,
        cohort,
        score,
        messageId: msg.id,
      },
      { source: 'crm', entityId: dealId, dedupeKey: `followup:${dealId}:${cohort}:${kind}` },
    );
  }

  return { processed, queued, skipped };
}
