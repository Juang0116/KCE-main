import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const { id } = await ctx.params;
    const parsed = ParamsSchema.safeParse({ id });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad id', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Supabase admin not configured', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const cRes = await (admin as any)
      .from('customers')
      .select('id,email,name,phone,country,language,created_at')
      .eq('id', id)
      .single();

    const customer: any = cRes?.data ?? null;

    if (cRes?.error || !customer) {
      return NextResponse.json(
        { error: 'Not found', requestId },
        { status: 404, headers: withRequestId(undefined, requestId) },
      );
    }

    const email = String(customer.email || '').trim();
    const lcEmail = email.toLowerCase();

    // Bookings por customer_email
    const bookingsRes: { data: any[]; error: any } = email
      ? await (admin as any)
          .from('bookings')
          .select(
            'id,status,stripe_session_id,tour_id,date,persons,total,currency,origin_currency,tour_price_minor,customer_email,customer_name,phone,created_at',
          )
          .ilike('customer_email', lcEmail)
          .order('created_at', { ascending: false })
          .limit(200)
      : { data: [], error: null };

    // Leads por email
    const leadsRes: { data: any[]; error: any } = email
      ? await (admin as any)
          .from('leads')
          .select('id,email,whatsapp,source,language,stage,tags,notes,created_at')
          .ilike('email', lcEmail)
          .order('created_at', { ascending: false })
          .limit(50)
      : { data: [], error: null };

    // Conversations vinculadas
    const leadIds = (leadsRes.data ?? []).map((l: any) => l?.id).filter(Boolean) as string[];

    let conversationsQuery: any = (admin as any)
      .from('conversations')
      .select('id,lead_id,customer_id,channel,locale,status,closed_at,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (leadIds.length) {
      // Nota: usamos .or con customer_id OR lead_id in (...)
      // Si leadIds tiene uuid, mejor con comillas no hace falta; lo dejamos simple.
      conversationsQuery = conversationsQuery.or(
        `customer_id.eq.${id},lead_id.in.(${leadIds.join(',')})`,
      );
    } else {
      conversationsQuery = conversationsQuery.eq('customer_id', id);
    }

    const conversationsRes: { data: any[]; error: any } = await conversationsQuery;

    // Events timeline (últimos 200) por entity_id (customer + bookingIds + leadIds)
    const entityIds = [id, ...(bookingsRes.data ?? []).map((b: any) => b?.id), ...leadIds]
      .filter(Boolean)
      .slice(0, 50);

    const eventsRes: { data: any[]; error: any } = entityIds.length
      ? await (admin as any)
          .from('events')
          .select('id,type,source,entity_id,dedupe_key,payload,created_at')
          .in('entity_id', entityIds)
          .order('created_at', { ascending: false })
          .limit(200)
      : { data: [], error: null };

    if (bookingsRes.error || leadsRes.error || conversationsRes.error || eventsRes.error) {
      await logEvent(
        'api.error',
        {
          requestId,
          route: '/api/admin/customers/[id]',
          message: [
            bookingsRes.error?.message,
            leadsRes.error?.message,
            conversationsRes.error?.message,
            eventsRes.error?.message,
          ]
            .filter(Boolean)
            .join(' | '),
        },
        { source: 'api' },
      );
    }

    return NextResponse.json(
      {
        customer,
        bookings: bookingsRes.data ?? [],
        leads: leadsRes.data ?? [],
        conversations: conversationsRes.data ?? [],
        events: eventsRes.data ?? [],
        requestId,
      },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/customers/[id]',
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
