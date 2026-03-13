// src/lib/templates.server.ts
import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import type { Database } from '@/types/supabase';

export type TemplateChannel = 'whatsapp' | 'email' | 'any';

export type CrmTemplateRow = Database['public']['Tables']['crm_templates']['Row'];

function normalizeLocale(locale: string | null | undefined): string {
  const l = (locale ?? 'es').toLowerCase();
  if (l.startsWith('en')) return 'en';
  if (l.startsWith('de')) return 'de';
  if (l.startsWith('fr')) return 'fr';
  return 'es';
}

export function renderTemplateText(
  text: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (_m, key) => {
    const v = vars[key];
    if (v === null || v === undefined) return '';
    return String(v);
  });
}

const DEFAULT_TEMPLATES: Record<string, Partial<Record<string, { subject?: string; body: string }>>> = {
  // keys -> locale -> template
  'deal.followup.new': {
    es: {
      body:
        'Hola {name} 👋 Soy del equipo KCE. Vi tu interés en {tour}. ¿Qué fecha te gustaría y cuántas personas serían?\n\nPuedo enviarte la propuesta y, si ya está listo, el link de pago.',
    },
    en: {
      body:
        'Hi {name} 👋 This is KCE team. I saw your interest in {tour}. What date would you like and how many people?\n\nI can send you the proposal and, if you are ready, the payment link.',
    },
    de: {
      body:
        'Hallo {name} 👋 Hier ist das KCE-Team. Ich habe dein Interesse an {tour} gesehen. Für welches Datum und wie viele Personen?\n\nIch kann dir das Angebot schicken und – wenn du bereit bist – den Zahlungslink.',
    },
  },
  'deal.followup.checkout': {
    es: {
      body:
        'Hola {name} 🙌 Te comparto el link de pago para confirmar tu reserva de {tour}: {checkout_url}\n\nCuando pagues, te llega confirmación + factura.',
      subject: 'Reserva {tour} - Link de pago',
    },
    en: {
      body:
        'Hi {name} 🙌 Here is the payment link to confirm your booking for {tour}: {checkout_url}\n\nAfter payment you will receive confirmation + invoice.',
      subject: 'Booking {tour} - Payment link',
    },
    de: {
      body:
        'Hallo {name} 🙌 Hier ist der Zahlungslink, um deine Buchung für {tour} zu bestätigen: {checkout_url}\n\nNach der Zahlung bekommst du Bestätigung + Rechnung.',
      subject: 'Buchung {tour} - Zahlungslink',
    },
  },

  'deal.followup.checkout_24h': {
    es: {
      body:
        'Hola {name} 🙌 Solo para asegurarme: ¿pudiste abrir el link de pago para {tour}? Aquí lo dejo de nuevo: {checkout_url}\n\nSi quieres, también puedo ayudarte por WhatsApp con cualquier duda.',
      subject: 'Recordatorio: link de pago — {tour}',
    },
    en: {
      body:
        'Hi {name} 🙌 Just checking: were you able to open the payment link for {tour}? Here it is again: {checkout_url}\n\nIf you prefer, I can also help via WhatsApp with any questions.',
      subject: 'Reminder: payment link — {tour}',
    },
    de: {
      body:
        'Hallo {name} 🙌 Kurze Nachfrage: Konntest du den Zahlungslink für {tour} öffnen? Hier ist er nochmal: {checkout_url}\n\nWenn du willst, helfe ich dir auch per WhatsApp bei Fragen.',
      subject: 'Erinnerung: Zahlungslink — {tour}',
    },
  },

  'deal.followup.checkout_48h': {
    es: {
      body:
        'Hola {name} 👋 Último recordatorio para confirmar {tour}. Si todavía te interesa, podemos ajustar fecha/personas y te mando el link actualizado.\n\n¿Te gustaría continuar?',
      subject: '¿Confirmamos tu reserva de {tour}?',
    },
    en: {
      body:
        'Hi {name} 👋 Final reminder to confirm {tour}. If you are still interested, we can adjust date/people and I can send an updated link.\n\nWould you like to continue?',
      subject: 'Shall we confirm your {tour} booking?',
    },
    de: {
      body:
        'Hallo {name} 👋 Letzte Erinnerung, um {tour} zu bestätigen. Wenn du noch interessiert bist, können wir Datum/Personen anpassen und ich sende dir einen aktualisierten Link.\n\nMöchtest du weitermachen?',
      subject: 'Sollen wir deine Buchung {tour} bestätigen?',
    },
  },

  'deal.followup.contacted': {
    es: {
      body: 'Hola {name} 👋 Quería confirmar si pudiste ver mi mensaje. ¿Te comparto opciones y disponibilidad para {tour}?',
    },
    en: {
      body: 'Hi {name} 👋 Just checking in—did you see my message? I can share options and availability for {tour}.',
    },
    de: {
      body: 'Hallo {name} 👋 Kurze Nachfrage: Hast du meine Nachricht gesehen? Ich kann dir Optionen und Verfügbarkeit für {tour} schicken.',
    },
  },
  'deal.followup.qualified': {
    es: { body: 'Perfecto {name} 🙌 Para enviarte una propuesta precisa de {tour}, ¿me confirmas fecha aproximada y cuántas personas son?' },
    en: { body: 'Great {name} 🙌 To send an accurate proposal for {tour}, could you confirm an approximate date and number of people?' },
    de: { body: 'Super {name} 🙌 Für ein genaues Angebot zu {tour}: Kannst du mir ein ungefähres Datum und die Personenzahl bestätigen?' },
  },
  'deal.followup.proposal': {
    es: { body: 'Hola {name} 👋 Te acabo de enviar la propuesta de {tour}. ¿La pudiste revisar? Si te parece bien, te envío el link de pago.' },
    en: { body: 'Hi {name} 👋 I just sent the {tour} proposal. Were you able to review it? If it looks good, I can send the payment link.' },
    de: { body: 'Hallo {name} 👋 Ich habe dir gerade das Angebot für {tour} geschickt. Konntest du es schon ansehen? Wenn alles passt, sende ich dir den Zahlungslink.' },
  },
};

export async function hash32FNV1a(input: string): Promise<number> {
  // lightweight stable hash for deterministic variant selection
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    // 32-bit FNV-1a prime
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

function pickWeighted<T extends { weight?: number | null }>(items: T[], seed: number): T | null {
  if (!items.length) return null;
  const weights = items.map((it) => Math.max(1, Number(it.weight ?? 1) || 1));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[0] ?? null;
  const r = seed % total;
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i]!;
    if (r < acc) return items[i]!;
  }
  return items[items.length - 1] ?? null;
}

type VariantPerf = { sent: number; replied: number; paid: number };
type PerfResult = { byVariant: Record<string, VariantPerf>; winner: string | null };

const __perfCache: Map<string, { expiresAt: number; byVariant: Record<string, VariantPerf>; winner: string | null }> =
  // eslint-disable-next-line no-restricted-globals
  (globalThis as any).__kcePerfCache ?? new Map();

try {
  // eslint-disable-next-line no-restricted-globals
  (globalThis as any).__kcePerfCache = __perfCache;
} catch {}

/**
 * Compute simple A/B performance for a template key (and channel) from crm_outbound_messages.
 * Cached to avoid hammering PostgREST on frequent renders.
 */
async function getTemplatePerf(params: {
  key: string;
  channel: TemplateChannel;
  locale?: string | null;
  days: number;
  minSamples: number;
}): Promise<PerfResult | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const locale = normalizeLocale(params.locale);
  const cacheKey = `${params.key}|${params.channel}|${locale}|${params.days}|${params.minSamples}`;
  const now = Date.now();
  const cached = __perfCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return { byVariant: cached.byVariant, winner: cached.winner };
  }

  const sinceISO = new Date(now - params.days * 24 * 60 * 60 * 1000).toISOString();

  // Note: locale may not exist as a top-level column; we store it in metadata when available.
  const res = await admin
    .from('crm_outbound_messages')
    .select('template_variant,outcome,status,sent_at,metadata')
    .eq('template_key', params.key)
    .eq('channel', params.channel)
    .eq('status', 'sent')
    .gte('sent_at', sinceISO)
    .limit(2000);

  if (res.error || !res.data) {
    __perfCache.set(cacheKey, { expiresAt: now + 5 * 60 * 1000, byVariant: {}, winner: null });
    return { byVariant: {}, winner: null };
  }

  const byVariant: Record<string, VariantPerf> = {};
  for (const row of res.data as any[]) {
    const v = String(row.template_variant ?? 'A').toUpperCase();
    const metaLocale = normalizeLocale(row.metadata?.locale);
    // if locale differs we still count, but at half weight (heuristic)
    const w = metaLocale === locale ? 1 : 0.5;

    byVariant[v] ||= { sent: 0, replied: 0, paid: 0 };
    byVariant[v].sent += w;
    if (row.outcome === 'replied') byVariant[v].replied += w;
    if (row.outcome === 'paid') byVariant[v].paid += w;
  }

  // Determine winner by paid rate with min sample threshold
  let winner: string | null = null;
  const variants = Object.entries(byVariant)
    .filter(([, s]) => (s.sent ?? 0) >= params.minSamples)
    .map(([variant, s]) => ({
      variant,
      sent: s.sent,
      paid: s.paid,
      rate: s.sent > 0 ? s.paid / s.sent : 0,
    }))
    .sort((a, b) => (b.rate - a.rate) || (b.sent - a.sent) || a.variant.localeCompare(b.variant));

  if (variants.length >= 1) {
    if (variants.length === 1) {
      winner = variants[0]!.variant;
    } else {
      const top = variants[0]!;
      const second = variants[1]!;
      const delta = top.rate - second.rate;
      // keep your conservative-but-non-blocking behavior
      winner = delta >= 0.02 || top.sent >= second.sent * 1.5 ? top.variant : top.variant;
    }
  }

  __perfCache.set(cacheKey, { expiresAt: now + 10 * 60 * 1000, byVariant, winner });
  return { byVariant, winner };
}

type WinnerLockResult = { winner: string | null; lockUntil: string | null };

const __lockCache: Map<string, { expiresAt: number; winner: string | null; lockUntil: string | null }> =
  // eslint-disable-next-line no-restricted-globals
  (globalThis as any).__kceWinnerLockCache ?? new Map();

try {
  // eslint-disable-next-line no-restricted-globals
  (globalThis as any).__kceWinnerLockCache = __lockCache;
} catch {}

function isoWeekCohort(d: Date): string {
  // ISO week cohort: YYYY-Www
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Winner lock read: avoids thrashing A/B selection within a cohort window.
 * Read-only at render time; cron/job should write locks.
 */
async function getWinnerLock(params: { key: string; channel: TemplateChannel; locale: string }): Promise<WinnerLockResult | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const cohort = isoWeekCohort(new Date());
  const cacheKey = `${params.key}|${params.channel}|${params.locale}|${cohort}`;
  const now = Date.now();
  const cached = __lockCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return { winner: cached.winner, lockUntil: cached.lockUntil };

  const res = await admin
    .from('crm_template_winner_locks')
    .select('winner_variant,lock_until,cohort')
    .eq('key', params.key)
    .eq('channel', params.channel)
    .eq('locale', params.locale)
    .eq('cohort', cohort)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (res.error) {
    __lockCache.set(cacheKey, { expiresAt: now + 5 * 60 * 1000, winner: null, lockUntil: null });
    return { winner: null, lockUntil: null };
  }

  const winner = res.data?.winner_variant ? String(res.data.winner_variant).toUpperCase() : null;
  const lockUntil = res.data?.lock_until ? String(res.data.lock_until) : null;

  __lockCache.set(cacheKey, { expiresAt: now + 10 * 60 * 1000, winner, lockUntil });
  return { winner, lockUntil };
}

async function getCrmTemplate(params: {
  key: string;
  locale?: string | null;
  channel?: TemplateChannel | null;
  seed?: string | null; // deterministic A/B selection
  preferWinner?: boolean;
  perfDays?: number;
  minSamples?: number;
}): Promise<CrmTemplateRow | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const key = params.key;
  const channel = (params.channel ?? 'any') as TemplateChannel;
  const locale = normalizeLocale(params.locale);

  // try exact locale, then es, then en
  const locales = [locale, 'es', 'en'];

  const seedStr = (params.seed ?? '').trim();
  const seedNum = await hash32FNV1a(`${key}|${locale}|${channel}|${seedStr || 'seed'}`);

  for (const loc of locales) {
    const q = admin
      .from('crm_templates')
      .select('id,key,locale,channel,variant,weight,subject,body,enabled,created_at,updated_at')
      .eq('key', key)
      .eq('locale', loc)
      .eq('enabled', true)
      .in('channel', channel === 'any' ? ['any', 'whatsapp', 'email'] : [channel, 'any'])
      .order('channel', { ascending: false })
      .order('variant', { ascending: true })
      .limit(20);

    const res = await q;
    if (!res.error && res.data && res.data.length) {
      const rows = res.data as any[];

      // Optional: prefer the currently winning variant when we have enough data.
      if (params.preferWinner && rows.length > 1) {
        // 1) Cohort winner lock
        const lockChannel = (channel === 'any' ? 'any' : channel) as TemplateChannel;
        const lock = await getWinnerLock({ key, channel: lockChannel, locale: loc });
        if (lock?.winner) {
          const winnerRow = rows.find(
            (r) => String((r as any).variant ?? '').toUpperCase() === String(lock.winner).toUpperCase(),
          );
          if (winnerRow) return winnerRow as any;
        }

        // 2) Fallback: compute winner on the fly (cached)
        const perf = await getTemplatePerf({
          key,
          channel,
          locale: loc,
          days: Math.max(7, params.perfDays ?? 30),
          minSamples: Math.max(10, params.minSamples ?? 30),
        });
        if (perf?.winner) {
          const winnerRow = rows.find(
            (r) => String((r as any).variant ?? '').toUpperCase() === String(perf.winner).toUpperCase(),
          );
          if (winnerRow) return winnerRow as any;
        }
      }

      // baseline: pick weighted deterministically by seed
      const picked = pickWeighted(rows as any, seedNum);
      return (picked as any) ?? (rows[0] as any);
    }
  }

  return null;
}

export async function renderCrmTemplate(params: {
  key: string;
  locale?: string | null;
  channel?: TemplateChannel | null;
  vars: Record<string, string | number | null | undefined>;
  seed?: string | null;
  preferWinner?: boolean;
  perfDays?: number;
  minSamples?: number;
}): Promise<{ subject: string | null; body: string; templateVariant?: string | null; templateId?: string | null }> {
  const locale = normalizeLocale(params.locale);
  const channel = (params.channel ?? 'any') as TemplateChannel;

  const row = await getCrmTemplate({
    key: params.key,
    locale,
    channel,
    seed: (params as any).seed ?? null,
    preferWinner: (params as any).preferWinner ?? true,
    perfDays: (params as any).perfDays ?? 30,
    minSamples: (params as any).minSamples ?? 30,
  });

  if (row) {
    return {
      subject: row.subject ? renderTemplateText(row.subject, params.vars) : null,
      body: renderTemplateText(row.body, params.vars),
      templateVariant: (row as any).variant ?? null,
      templateId: (row as any).id ?? null,
    };
  }

  // fallback defaults
  const fallback = DEFAULT_TEMPLATES[params.key]?.[locale] ?? DEFAULT_TEMPLATES[params.key]?.es;
  if (fallback) {
    return {
      subject: fallback.subject ? renderTemplateText(fallback.subject, params.vars) : null,
      body: renderTemplateText(fallback.body, params.vars),
      templateVariant: null,
      templateId: null,
    };
  }

  // last-resort
  return {
    subject: null,
    body: renderTemplateText('{name}', params.vars),
  };
}
