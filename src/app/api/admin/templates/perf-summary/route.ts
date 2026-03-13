import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeLocale(locale: any): 'es' | 'en' | 'de' | 'fr' {
  const l = String(locale ?? 'es').toLowerCase();
  if (l.startsWith('en')) return 'en';
  if (l.startsWith('de')) return 'de';
  if (l.startsWith('fr')) return 'fr';
  return 'es';
}

const QuerySchema = z.object({
  days: z.coerce.number().min(7).max(180).default(30),
  limit: z.coerce.number().min(500).max(10000).default(5000),
});

type Stat = { sent: number; replied: number; paid: number };

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    days: url.searchParams.get('days') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad_request', issues: parsed.error.flatten() }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'supabase_admin_not_configured' }, { status: 500 });

  const sinceISO = new Date(Date.now() - parsed.data.days * 24 * 60 * 60 * 1000).toISOString();

  const res = await admin
    .from('crm_outbound_messages')
    .select('template_key,template_variant,channel,outcome,status,sent_at,metadata')
    .eq('status', 'sent')
    .gte('sent_at', sinceISO)
    .limit(parsed.data.limit);

  if (res.error) {
    return NextResponse.json({ error: 'query_failed', detail: res.error.message }, { status: 500 });
  }

  const byKey: Record<string, Record<string, Stat>> = {};

  for (const row of (res.data ?? []) as any[]) {
    const key = String(row.template_key ?? '');
    if (!key) continue;
    const channel = String(row.channel ?? 'any');
    const variant = String(row.template_variant ?? 'A').toUpperCase();
    const locale = normalizeLocale(row.metadata?.locale);
    const groupKey = `${key}|${channel}|${locale}`;

    byKey[groupKey] ||= {};
    byKey[groupKey][variant] ||= { sent: 0, replied: 0, paid: 0 };

    byKey[groupKey][variant].sent += 1;
    if (row.outcome === 'replied') byKey[groupKey][variant].replied += 1;
    if (row.outcome === 'paid') byKey[groupKey][variant].paid += 1;
  }

  const items = Object.entries(byKey).map(([groupKey, variants]) => {
    const [key, channel, locale] = groupKey.split('|');
    const entries = Object.entries(variants).map(([variant, s]) => ({
      variant,
      sent: s.sent,
      replied: s.replied,
      paid: s.paid,
      replyRate: s.sent ? s.replied / s.sent : 0,
      paidRate: s.sent ? s.paid / s.sent : 0,
    }));
    entries.sort((a, b) => (b.paidRate - a.paidRate) || (b.sent - a.sent) || a.variant.localeCompare(b.variant));
    return {
      key,
      channel,
      locale,
      winner: entries[0]?.variant ?? null,
      variants: entries,
    };
  });

  // sort: most important templates first by winner paidRate * volume
  items.sort((a: any, b: any) => {
    const aw = a.variants?.[0];
    const bw = b.variants?.[0];
    const as = (aw?.paidRate ?? 0) * (aw?.sent ?? 0);
    const bs = (bw?.paidRate ?? 0) * (bw?.sent ?? 0);
    return bs - as;
  });

  return NextResponse.json({ days: parsed.data.days, items });
}
