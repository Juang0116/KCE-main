// src/app/api/admin/metrics/utm/route.ts
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
});

const TYPES = [
  'marketing.utm_capture',
  'newsletter.signup_confirmed',
  'quiz.completed',
  'checkout.paid',
] as const;

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

type Row = {
  type: string;
  payload: any;
  created_at: string;
};

function safeRate(n: number, d: number) {
  if (!d) return 0;
  return n / d;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const url = new URL(req.url);

  const parsed = QuerySchema.safeParse({
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
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

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('events')
    .select('type,payload,created_at')
    .in('type', [...TYPES])
    .gte('created_at', toIsoStart(from))
    .lt('created_at', toIsoEndExclusive(to))
    .limit(5000);

  if (error) {
    return NextResponse.json(
      { ok: false, requestId, error: error.message },
      { status: 500, headers: withRequestId(new Headers(), requestId) },
    );
  }

  const rows = (data ?? []) as Row[];

  const agg: Record<
    string,
    { utm_source: string; utm_medium: string; utm_campaign: string; counts: Record<string, number> }
  > = {};

  for (const r of rows) {
    const p = r.payload ?? {};
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

    const key = `${utm_source}||${utm_medium}||${utm_campaign}`;
    if (!agg[key]) {
      agg[key] = { utm_source, utm_medium, utm_campaign, counts: {} };
    }
    agg[key].counts[r.type] = (agg[key].counts[r.type] ?? 0) + 1;
  }

  const items = Object.values(agg)
    .map((x) => ({
      ...x,
      utm_key: `${x.utm_source}/${x.utm_medium}/${x.utm_campaign}`,
      utm_captures: x.counts['marketing.utm_capture'] ?? 0,
      newsletter_confirmed: x.counts['newsletter.signup_confirmed'] ?? 0,
      quiz_completed: x.counts['quiz.completed'] ?? 0,
      checkout_paid: x.counts['checkout.paid'] ?? 0,
      rates: {
        confirmPerCapture: safeRate(
          x.counts['newsletter.signup_confirmed'] ?? 0,
          x.counts['marketing.utm_capture'] ?? 0,
        ),
        quizPerCapture: safeRate(
          x.counts['quiz.completed'] ?? 0,
          x.counts['marketing.utm_capture'] ?? 0,
        ),
        paidPerCapture: safeRate(
          x.counts['checkout.paid'] ?? 0,
          x.counts['marketing.utm_capture'] ?? 0,
        ),
        paidPerQuiz: safeRate(x.counts['checkout.paid'] ?? 0, x.counts['quiz.completed'] ?? 0),
      },
    }))
    .sort(
      (a, b) =>
        b.checkout_paid - a.checkout_paid ||
        b.quiz_completed - a.quiz_completed ||
        b.utm_captures - a.utm_captures,
    );

  const totals = items.reduce(
    (acc, r) => {
      acc.utm_captures += r.utm_captures;
      acc.newsletter_confirmed += r.newsletter_confirmed;
      acc.quiz_completed += r.quiz_completed;
      acc.checkout_paid += r.checkout_paid;
      return acc;
    },
    { utm_captures: 0, newsletter_confirmed: 0, quiz_completed: 0, checkout_paid: 0 },
  );

  const summary = {
    totals,
    rates: {
      confirmPerCapture: safeRate(totals.newsletter_confirmed, totals.utm_captures),
      quizPerCapture: safeRate(totals.quiz_completed, totals.utm_captures),
      paidPerCapture: safeRate(totals.checkout_paid, totals.utm_captures),
      paidPerQuiz: safeRate(totals.checkout_paid, totals.quiz_completed),
    },
  };

  return NextResponse.json(
    { ok: true, requestId, window: { from, to }, summary, items },
    { headers: withRequestId(new Headers(), requestId) },
  );
}
