// src/app/api/admin/metrics/marketing/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseDaysParam(sp: URLSearchParams, fallback: number) {
  const v = (sp.get('days') || '').trim();
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

async function countByType(supabase: ReturnType<typeof getSupabaseAdmin>, type: string, sinceISO: string) {
  const q = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('type', type)
    .gte('created_at', sinceISO);
  return q.count ?? 0;
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  // Scope inferred from pathname (/api/admin/metrics/...) → analytics_view.
  // NOTE: do NOT pass objects here; requireAdminScope expects a capability string.
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const days = clamp(parseDaysParam(searchParams, 30), 1, 120);
  const sinceISO = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const admin = getSupabaseAdmin();

  // Marketing funnel primitives
  const types = [
    'marketing.utm_capture',
    'tour.view',
    'quiz.completed',
    'newsletter.signup_pending',
    'newsletter.signup_confirmed',
    'checkout.paid',
    'email.booking_confirmation.sent',
    'lead_magnet.eu_guide.requested',
    'email.lead_magnet.eu_guide.sent',
  ] as const;

  const counts: Record<string, number> = {};
  for (const t of types) counts[t] = await countByType(admin, t, sinceISO);

  const utm = counts['marketing.utm_capture'] || 0;
  const tourView = counts['tour.view'] || 0;
  const quiz = counts['quiz.completed'] || 0;
  const nlConfirmed = counts['newsletter.signup_confirmed'] || 0;
  const paid = counts['checkout.paid'] || 0;

  const safeRate = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

  return NextResponse.json(
    {
      ok: true,
      requestId,
      windowDays: days,
      sinceISO,
      counts,
      rates: {
        tourView_per_utm: safeRate(tourView, utm),
        quiz_per_tourView: safeRate(quiz, tourView),
        newsletterConfirmed_per_quiz: safeRate(nlConfirmed, quiz),
        paid_per_tourView: safeRate(paid, tourView),
      },
    },
    { headers: withRequestId(undefined, requestId) },
  );
}
