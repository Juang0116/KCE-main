// src/app/api/admin/metrics/utm/by-tour/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  utm_key: z.string().trim().min(3),
  from: z.string().min(8).optional(),
  to: z.string().min(8).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const TYPES = ['tour.view', 'checkout.started', 'checkout.paid'] as const;

function dayIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function toIsoStart(dateStr: string) {
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

function toIsoEndExclusive(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

function pickUtmKey(payload: any): string {
  const p = payload ?? {};
  const src = String(
    p.utm_source ||
      p.utm?.utm_source ||
      (p.utm_key ? String(p.utm_key).split('/')[0] : '') ||
      'direct',
  );
  const med = String(
    p.utm_medium ||
      p.utm?.utm_medium ||
      (p.utm_key ? String(p.utm_key).split('/')[1] : '') ||
      'none',
  );
  const camp = String(
    p.utm_campaign ||
      p.utm?.utm_campaign ||
      (p.utm_key ? String(p.utm_key).split('/')[2] : '') ||
      'na',
  );
  return `${src}/${med}/${camp}`;
}

function pickTourSlug(payload: any): string {
  const p = payload ?? {};
  const slug =
    (typeof p.tour_slug === 'string' && p.tour_slug) ||
    (typeof p.slug === 'string' && p.slug) ||
    (typeof p?.meta?.tour_slug === 'string' && p.meta.tour_slug) ||
    (typeof p?.meta?.slug === 'string' && p.meta.slug) ||
    (typeof p?.tour?.slug === 'string' && p.tour.slug) ||
    '';
  return String(slug || '').trim();
}

type EventRow = { type: (typeof TYPES)[number] | string; payload: any };

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);
  const url = new URL(req.url);

  const parsed = QuerySchema.safeParse({
    utm_key: url.searchParams.get('utm_key') ?? undefined,
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
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
  const utmKey = parsed.data.utm_key;
  const limit = parsed.data.limit ?? 50;

  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('events')
    .select('type,payload')
    .in('type', [...TYPES])
    .gte('created_at', toIsoStart(from))
    .lt('created_at', toIsoEndExclusive(to))
    .limit(15000);

  if (error) {
    return NextResponse.json(
      { ok: false, requestId, error: error.message },
      { status: 500, headers: withRequestId(new Headers(), requestId) },
    );
  }

  const rows = (data ?? []) as EventRow[];

  // agg por tour_slug
  const agg: Record<string, { views: number; started: number; paid: number }> = {};

  for (const e of rows) {
    const k = pickUtmKey(e.payload);
    if (k !== utmKey) continue;

    const slug = pickTourSlug(e.payload);
    if (!slug) continue;

    const cur = agg[slug] ?? { views: 0, started: 0, paid: 0 };
    if (e.type === 'tour.view') cur.views += 1;
    if (e.type === 'checkout.started') cur.started += 1;
    if (e.type === 'checkout.paid') cur.paid += 1;
    agg[slug] = cur;
  }

  const slugs = Object.keys(agg);

  // info tours
  let tourInfo: Record<string, { title: string | null; city: string | null }> = {};
  if (slugs.length) {
    const t = await admin.from('tours').select('slug,title,city').in('slug', slugs.slice(0, 500));
    if (!t.error && t.data) {
      tourInfo = Object.fromEntries(
        t.data.map((r: any) => [String(r.slug), { title: r.title ?? null, city: r.city ?? null }]),
      );
    }
  }

  const items = slugs
    .map((slug) => {
      // FIX principal: nunca undefined
      const c = agg[slug] ?? { views: 0, started: 0, paid: 0 };
      const info = tourInfo[slug];

      const views = c.views;
      const started = c.started;
      const paid = c.paid;

      return {
        tour_slug: slug,
        tour_title: info?.title ?? null,
        city: info?.city ?? null,
        tour_views: views,
        checkout_started: started,
        checkout_paid: paid,
        rates: {
          startPerView: views ? started / views : 0,
          paidPerStart: started ? paid / started : 0,
          paidPerView: views ? paid / views : 0,
        },
      };
    })
    .sort(
      (a, b) =>
        b.checkout_paid - a.checkout_paid ||
        b.checkout_started - a.checkout_started ||
        b.tour_views - a.tour_views,
    )
    .slice(0, limit);

  return NextResponse.json(
    { ok: true, requestId, window: { from, to }, utm_key: utmKey, items },
    { headers: withRequestId(new Headers(), requestId) },
  );
}
