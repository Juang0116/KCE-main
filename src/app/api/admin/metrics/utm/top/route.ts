// src/app/api/admin/metrics/utm/top/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  from: z.string().min(8).optional(),
  to: z.string().min(8).optional(),
  min_captures: z.coerce.number().int().min(0).max(100000).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const TYPES = [
  'marketing.utm_capture',
  'newsletter.signup_confirmed',
  'quiz.completed',
  'checkout.paid',
] as const;
type EventType = (typeof TYPES)[number];

function dayIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function toIsoStart(dateStr: string) {
  return new Date(dateStr + 'T00:00:00.000Z').toISOString();
}

function toIsoEndExclusive(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

type Row = { type: EventType; payload: any };

function safeRate(n: number, d: number) {
  if (!d) return 0;
  return n / d;
}

function pickUtmKey(payload: any): {
  utm_key: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
} {
  const p = payload ?? {};

  const utm_source = String(
    p.utm_source ||
      p.utm?.utm_source ||
      (p.utm_key ? String(p.utm_key).split('/')[0] : '') ||
      'direct',
  );
  const utm_medium = String(
    p.utm_medium ||
      p.utm?.utm_medium ||
      (p.utm_key ? String(p.utm_key).split('/')[1] : '') ||
      'none',
  );
  const utm_campaign = String(
    p.utm_campaign ||
      p.utm?.utm_campaign ||
      (p.utm_key ? String(p.utm_key).split('/')[2] : '') ||
      'na',
  );
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
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const url = new URL(req.url);

  const parsed = QuerySchema.safeParse({
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
    min_captures: url.searchParams.get('min_captures') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Bad query' },
      { status: 400, headers: withRequestId(new Headers(), requestId) },
    );
  }

  const today = new Date();
  const from = parsed.data.from ?? dayIso(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
  const to = parsed.data.to ?? dayIso(today);
  const minCaptures = parsed.data.min_captures ?? 30;
  const limit = parsed.data.limit ?? 20;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('events')
    .select('type,payload')
    .in('type', [...TYPES])
    .gte('created_at', toIsoStart(from))
    .lt('created_at', toIsoEndExclusive(to))
    .limit(10000);

  if (error) {
    return NextResponse.json(
      { ok: false, requestId, error: error.message },
      { status: 500, headers: withRequestId(new Headers(), requestId) },
    );
  }

  const rows = (data ?? []) as Row[];
  const agg: Record<string, AggItem> = {};

  for (const r of rows) {
    const utm = pickUtmKey(r.payload);

    // noUncheckedIndexedAccess-safe: no re-indexing without a guard
    let entry = agg[utm.utm_key];
    if (!entry) {
      entry = {
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        counts: {},
      };
      agg[utm.utm_key] = entry;
    }

    const t = r.type;
    entry.counts[t] = (entry.counts[t] ?? 0) + 1;
  }

  const items = Object.entries(agg)
    .map(([utm_key, x]) => {
      const utm_captures = x.counts['marketing.utm_capture'] ?? 0;
      const newsletter_confirmed = x.counts['newsletter.signup_confirmed'] ?? 0;
      const quiz_completed = x.counts['quiz.completed'] ?? 0;
      const checkout_paid = x.counts['checkout.paid'] ?? 0;

      return {
        utm_key,
        utm_source: x.utm_source,
        utm_medium: x.utm_medium,
        utm_campaign: x.utm_campaign,
        utm_captures,
        newsletter_confirmed,
        quiz_completed,
        checkout_paid,
        rates: {
          quizPerCapture: safeRate(quiz_completed, utm_captures),
          confirmPerCapture: safeRate(newsletter_confirmed, utm_captures),
          paidPerCapture: safeRate(checkout_paid, utm_captures),
          paidPerQuiz: safeRate(checkout_paid, quiz_completed),
        },
      };
    })
    .filter((x) => x.utm_captures >= minCaptures)
    .sort(
      (a, b) =>
        b.rates.paidPerCapture - a.rates.paidPerCapture ||
        b.checkout_paid - a.checkout_paid ||
        b.utm_captures - a.utm_captures,
    )
    .slice(0, limit);

  return NextResponse.json(
    { ok: true, requestId, window: { from, to }, params: { minCaptures, limit }, items },
    { headers: withRequestId(new Headers(), requestId) },
  );
}
