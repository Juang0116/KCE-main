// src/lib/funnelStages.server.ts
import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

type FunnelStageKey = {
  templateKey: string;
  templateVariant: string;
  channel: string;
  locale: string;
  cohort: string;
};

export type FunnelStagesRow = FunnelStageKey & {
  sent: number;
  replied: number;
  checkoutOpened: number;
  paid: number;
  rates: {
    replyPerSent: number;
    openPerSent: number;
    paidPerSent: number;
    paidPerOpen: number;
  };
};

export type FunnelStagesResponse = {
  ok: true;
  window: { sinceIso: string; toIso: string; days: number };
  totals: {
    sent: number;
    replied: number;
    checkoutOpened: number;
    paid: number;
  };
  items: FunnelStagesRow[];
  truncated: boolean;
};

function safeRate(a: number, b: number) {
  if (!b) return 0;
  return a / b;
}

// ISO week label: YYYY-Www
function isoWeekLabel(d: Date): string {
  // Copy date so we don't mutate input
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // Thursday in current week decides the year.
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const ww = String(weekNo).padStart(2, '0');
  return `${date.getUTCFullYear()}-W${ww}`;
}

function normLocale(v: any): string {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return 'es';
  // keep it simple: es, en, de, fr...
  return s.slice(0, 8);
}

function keyToString(k: FunnelStageKey): string {
  return `${k.templateKey}|${k.templateVariant}|${k.channel}|${k.locale}|${k.cohort}`;
}

export async function computeFunnelStages(params: {
  days?: number;
  limit?: number;
  openWindowDays?: number;
}): Promise<FunnelStagesResponse> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin not configured');

  const days = Math.min(Math.max(params.days ?? 30, 1), 90);
  const limit = Math.min(Math.max(params.limit ?? 1000, 50), 5000);
  const openWindowDays = Math.min(Math.max(params.openWindowDays ?? 14, 1), 30);

  const toIso = new Date().toISOString();
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Fetch outbound messages (we aggregate at message level, not deal level)
  const msgs = await (admin as any)
    .from('crm_outbound_messages')
    .select(
      [
        'id',
        'deal_id',
        'channel',
        'status',
        'template_key',
        'template_variant',
        'metadata',
        'sent_at',
        'replied_at',
        'outcome',
        'attributed_won_at',
      ].join(','),
    )
    .gte('sent_at', sinceIso)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (msgs.error) throw new Error(msgs.error.message);

  const rows = (msgs.data || []) as any[];
  const truncated = rows.length >= limit;

  // Deals for checkout_opened_at + stage/closed_at fallback
  const dealIds = Array.from(new Set(rows.map((r) => r.deal_id).filter(Boolean)));
  const dealsMap = new Map<string, any>();
  if (dealIds.length) {
    // Note: checkout_opened_at exists via patches (may not be in generated types)
    const deals = await (admin as any)
      .from('deals')
      .select('id,stage,checkout_opened_at,closed_at')
      .in('id', dealIds);

    if (!deals.error) {
      for (const d of deals.data || []) dealsMap.set(String(d.id), d);
    }
  }

  const agg = new Map<string, { key: FunnelStageKey; sent: number; replied: number; checkoutOpened: number; paid: number }>();

  let totalsSent = 0;
  let totalsReplied = 0;
  let totalsOpened = 0;
  let totalsPaid = 0;

  for (const r of rows) {
    const templateKey = String(r.template_key || 'none');
    const templateVariant = String(r.template_variant || '');
    const channel = String(r.channel || '');
    const locale = normLocale((r.metadata as any)?.locale);
    const sentAtIso = String(r.sent_at || '');
    const sentAt = sentAtIso ? new Date(sentAtIso) : new Date();
    const cohort = isoWeekLabel(sentAt);

    const key: FunnelStageKey = { templateKey, templateVariant, channel, locale, cohort };
    const ks = keyToString(key);
    const cur = agg.get(ks) || { key, sent: 0, replied: 0, checkoutOpened: 0, paid: 0 };

    // Stage 1: sent (message-level)
    cur.sent += 1;
    totalsSent += 1;

    // Stage 2: replied (message-level)
    const replied = Boolean(r.replied_at) || String(r.outcome || '') === 'replied';
    if (replied) {
      cur.replied += 1;
      totalsReplied += 1;
    }

    // Stage 3: checkout opened (deal-level, attributed to this message if within window after sent)
    let opened = false;
    const dealId = r.deal_id ? String(r.deal_id) : '';
    const d = dealId ? dealsMap.get(dealId) : null;
    const openedAtIso = d?.checkout_opened_at ? String(d.checkout_opened_at) : '';
    if (openedAtIso && sentAtIso) {
      const openedAt = new Date(openedAtIso).getTime();
      const sentMs = sentAt.getTime();
      if (openedAt >= sentMs && openedAt <= sentMs + openWindowDays * 24 * 60 * 60 * 1000) opened = true;
    }
    if (opened) {
      cur.checkoutOpened += 1;
      totalsOpened += 1;
    }

    // Stage 4: paid (prefer message attribution; fallback to deal won within window)
    let paid = String(r.outcome || '') === 'paid' || Boolean(r.attributed_won_at);
    if (!paid && d?.stage === 'won' && d?.closed_at && sentAtIso) {
      const closedAt = new Date(String(d.closed_at)).getTime();
      const sentMs = sentAt.getTime();
      if (closedAt >= sentMs && closedAt <= sentMs + openWindowDays * 24 * 60 * 60 * 1000) paid = true;
    }
    if (paid) {
      cur.paid += 1;
      totalsPaid += 1;
    }

    agg.set(ks, cur);
  }

  const items: FunnelStagesRow[] = Array.from(agg.values())
    .map((x) => {
      const { key, sent, replied, checkoutOpened, paid } = x;
      return {
        ...key,
        sent,
        replied,
        checkoutOpened,
        paid,
        rates: {
          replyPerSent: safeRate(replied, sent),
          openPerSent: safeRate(checkoutOpened, sent),
          paidPerSent: safeRate(paid, sent),
          paidPerOpen: safeRate(paid, checkoutOpened),
        },
      };
    })
    .sort((a, b) => (b.sent - a.sent) || (b.rates.paidPerSent - a.rates.paidPerSent));

  return {
    ok: true,
    window: { sinceIso, toIso, days },
    totals: { sent: totalsSent, replied: totalsReplied, checkoutOpened: totalsOpened, paid: totalsPaid },
    items,
    truncated,
  };
}
