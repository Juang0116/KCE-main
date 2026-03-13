// src/app/api/admin/conversations/route.ts
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
  lead_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  q: z.string().optional(),
  scope: z.enum(['meta', 'content']).default('meta'),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

type ConversationRow = {
  id: string;
  channel: string;
  locale: string;
  status: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  lead_id: string | null;
  customer_id: string | null;
  leads?: { email: string | null; whatsapp: string | null } | null;
  customers?: { email: string | null; name: string | null; phone: string | null } | null;
  last_message?: { role: string; content: string; created_at: string } | null;
};

function snippet(s: string, max = 140) {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

async function attachLastMessage(
  admin: ReturnType<typeof getSupabaseAdmin>,
  items: ConversationRow[],
) {
  const ids = items.map((c) => c.id);
  if (!ids.length) return;

  const msgRes = await admin
    .from('messages')
    .select('conversation_id,role,content,created_at')
    .in('conversation_id', ids)
    .order('created_at', { ascending: false });

  if (!msgRes.error && msgRes.data?.length) {
    const byConv = new Map<string, { role: string; content: string; created_at: string }>();
    for (const m of msgRes.data as any[]) {
      if (!byConv.has(m.conversation_id)) {
        byConv.set(m.conversation_id, {
          role: m.role,
          content: snippet(m.content),
          created_at: m.created_at,
        });
      }
    }
    for (const c of items) {
      c.last_message = byConv.get(c.id) ?? null;
    }
  }
}

/**
 * Importante:
 * NO usamos joins tipo leads(email,...) / customers(email,...) en el select de conversations,
 * porque si no existe FK/relación declarada en Postgres, Supabase devuelve SelectQueryError
 * y el build falla. Hidratamos manualmente por IDs.
 */
async function hydrateConversationParties(
  admin: ReturnType<typeof getSupabaseAdmin>,
  rows: Array<{
    id: string;
    channel: string;
    locale: string;
    status: string;
    closed_at: string | null;
    created_at: string;
    updated_at: string;
    lead_id: string | null;
    customer_id: string | null;
  }>,
): Promise<ConversationRow[]> {
  const leadIds = Array.from(new Set(rows.map((r) => r.lead_id).filter(Boolean))) as string[];
  const customerIds = Array.from(
    new Set(rows.map((r) => r.customer_id).filter(Boolean)),
  ) as string[];

  const [leadsRes, customersRes] = await Promise.all([
    leadIds.length
      ? admin.from('leads').select('id,email,whatsapp').in('id', leadIds)
      : Promise.resolve({ data: [], error: null } as any),
    customerIds.length
      ? admin.from('customers').select('id,email,name,phone').in('id', customerIds)
      : Promise.resolve({ data: [], error: null } as any),
  ]);

  const leadMap = new Map<string, { email: string | null; whatsapp: string | null }>();
  for (const l of (leadsRes.data ?? []) as any[]) {
    leadMap.set(String(l.id), { email: l.email ?? null, whatsapp: l.whatsapp ?? null });
  }

  const customerMap = new Map<
    string,
    { email: string | null; name: string | null; phone: string | null }
  >();
  for (const c of (customersRes.data ?? []) as any[]) {
    customerMap.set(String(c.id), {
      email: c.email ?? null,
      name: c.name ?? null,
      phone: c.phone ?? null,
    });
  }

  return rows.map((r) => ({
    ...r,
    leads: r.lead_id ? (leadMap.get(r.lead_id) ?? null) : null,
    customers: r.customer_id ? (customerMap.get(r.customer_id) ?? null) : null,
    last_message: null,
  }));
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      lead_id: url.searchParams.get('lead_id') ?? undefined,
      customer_id: url.searchParams.get('customer_id') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      scope: (url.searchParams.get('scope') as any) ?? undefined,
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const { lead_id, customer_id, q, scope, page, limit } = parsed.data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const admin = getSupabaseAdmin();

    // Scope: content => buscamos en mensajes y devolvemos conversaciones relacionadas.
    if (scope === 'content' && q?.trim()) {
      const qq = q.trim();

      const msgIds = await admin
        .from('messages')
        .select('conversation_id')
        .ilike('content', `%${qq}%`)
        .order('created_at', { ascending: false })
        .limit(500);

      if (msgIds.error) {
        await logEvent(
          'api.error',
          { requestId, route: '/api/admin/conversations', message: msgIds.error.message },
          { source: 'api' },
        );
        return NextResponse.json(
          { error: 'DB error', requestId },
          { status: 500, headers: withRequestId(undefined, requestId) },
        );
      }

      const convIds = Array.from(
        new Set((msgIds.data ?? []).map((r: any) => String(r.conversation_id))),
      ).filter(Boolean);

      if (!convIds.length) {
        return NextResponse.json(
          { items: [], page, limit, total: 0, requestId },
          { status: 200, headers: withRequestId(undefined, requestId) },
        );
      }

      let convQuery = admin
        .from('conversations')
        .select('id,channel,locale,status,created_at,updated_at,closed_at,lead_id,customer_id', {
          count: 'exact',
        })
        .in('id', convIds)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (lead_id) convQuery = convQuery.eq('lead_id', lead_id);
      if (customer_id) convQuery = convQuery.eq('customer_id', customer_id);

      const res = await convQuery;
      if (res.error) {
        await logEvent(
          'api.error',
          { requestId, route: '/api/admin/conversations', message: res.error.message },
          { source: 'api' },
        );
        return NextResponse.json(
          { error: 'DB error', requestId },
          { status: 500, headers: withRequestId(undefined, requestId) },
        );
      }

      const base = (res.data ?? []) as Array<{
        id: string;
        channel: string;
        locale: string;
        status: string;
        closed_at: string | null;
        created_at: string;
        updated_at: string;
        lead_id: string | null;
        customer_id: string | null;
      }>;

      const items = await hydrateConversationParties(admin, base);
      await attachLastMessage(admin, items);

      return NextResponse.json(
        { items, page, limit, total: res.count ?? null, requestId },
        { status: 200, headers: withRequestId(undefined, requestId) },
      );
    }

    // Scope: meta (default) => lista + filtro en memoria por lead/customer info hidratada
    let query = admin
      .from('conversations')
      .select('id,channel,locale,status,created_at,updated_at,closed_at,lead_id,customer_id', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (lead_id) query = query.eq('lead_id', lead_id);
    if (customer_id) query = query.eq('customer_id', customer_id);

    const res = await query;
    if (res.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/conversations', message: res.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const base = (res.data ?? []) as Array<{
      id: string;
      channel: string;
      locale: string;
      status: string;
      closed_at: string | null;
      created_at: string;
      updated_at: string;
      lead_id: string | null;
      customer_id: string | null;
    }>;

    let items = await hydrateConversationParties(admin, base);

    if (q) {
      const qq = q.trim().toLowerCase();
      if (qq) {
        items = items.filter((c) => {
          const hay = [
            c.leads?.email,
            c.leads?.whatsapp,
            c.customers?.email,
            c.customers?.name,
            c.customers?.phone,
          ]
            .filter(Boolean)
            .join(' | ')
            .toLowerCase();
          return hay.includes(qq);
        });
      }
    }

    await attachLastMessage(admin, items);

    return NextResponse.json(
      { items, page, limit, total: res.count ?? null, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/conversations',
        message: e instanceof Error ? e.message : 'unknown',
      },
      { source: 'api' },
    );
    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
