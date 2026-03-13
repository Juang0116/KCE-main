// src/app/api/admin/deals/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  stage: z.enum(['new', 'qualified', 'proposal', 'checkout', 'won', 'lost']).optional(),
  lead_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(100).default(25),
});

const CreateSchema = z.object({
  lead_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  tour_slug: z.string().trim().min(1).max(160).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  stage: z.enum(['new', 'qualified', 'proposal', 'checkout', 'won', 'lost']).optional(),
  amount_minor: z.number().int().min(0).max(10_000_000_000).optional(),
  currency: z.string().trim().min(3).max(8).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  assigned_to: z.string().trim().max(200).optional(),
  notes: z.string().max(4000).optional(),
  source: z.string().trim().max(50).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      stage: url.searchParams.get('stage') ?? undefined,
      lead_id: url.searchParams.get('lead_id') ?? undefined,
      customer_id: url.searchParams.get('customer_id') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const { stage, q, lead_id, customer_id, page, limit } = parsed.data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const admin = getSupabaseAdmin();
    const deals = admin as any;

    // Count (best-effort)
    const countQ = deals.from('deals').select('id', { count: 'exact', head: true });
    if (stage) countQ.eq('stage', stage);
    if (lead_id) countQ.eq('lead_id', lead_id);
    if (customer_id) countQ.eq('customer_id', customer_id);
    if (q?.trim()) countQ.or(`title.ilike.%${q.trim()}%,tour_slug.ilike.%${q.trim()}%`);
    const countRes = await countQ;
    const total = countRes?.count ?? null;

    let query = deals
      .from('deals')
      .select(
        'id,lead_id,customer_id,tour_slug,title,stage,amount_minor,currency,probability,assigned_to,notes,source,created_at,updated_at,closed_at,' +
          'leads:leads(email,whatsapp),' +
          'customers:customers(email,name,phone,country)',
      )
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (stage) query = query.eq('stage', stage);
    if (lead_id) query = query.eq('lead_id', lead_id);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (q?.trim()) query = query.or(`title.ilike.%${q.trim()}%,tour_slug.ilike.%${q.trim()}%`);

    const res = await query;

    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/deals', message: res.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    return NextResponse.json(
      { items: res.data ?? [], page, limit, total, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/deals', message: e instanceof Error ? e.message : 'unknown' },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const admin = getSupabaseAdmin();
    const deals = admin as any;

    const payload = {
      lead_id: parsed.data.lead_id ?? null,
      customer_id: parsed.data.customer_id ?? null,
      tour_slug: parsed.data.tour_slug ?? null,
      title: parsed.data.title ?? 'Tour booking',
      stage: parsed.data.stage ?? 'new',
      amount_minor: typeof parsed.data.amount_minor === 'number' ? parsed.data.amount_minor : null,
      currency: (parsed.data.currency ?? 'eur').toLowerCase(),
      probability: typeof parsed.data.probability === 'number' ? parsed.data.probability : 20,
      assigned_to: parsed.data.assigned_to ?? null,
      notes: parsed.data.notes ?? null,
      source: parsed.data.source ?? 'admin',
    };

    const ins = await deals.from('deals').insert(payload).select('id').single();

    if (ins.error || !ins.data?.id) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/deals', message: ins.error?.message || 'insert failed' },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    await logEvent(
      'deal.created',
      { requestId, dealId: ins.data.id, source: 'admin' },
      { source: 'admin', entityId: ins.data.id },
    );

    return NextResponse.json(
      { ok: true, dealId: ins.data.id, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/deals', message: e instanceof Error ? e.message : 'unknown' },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
