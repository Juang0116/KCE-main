import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateSchema = z
  .object({
    scope: z.enum(['tour', 'tag', 'city', 'global']),
    tour_id: z.string().uuid().optional().nullable(),
    tag: z.string().max(120).optional().nullable(),
    city: z.string().max(120).optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    min_persons: z.number().int().optional().nullable(),
    max_persons: z.number().int().optional().nullable(),
    currency: z.string().length(3).optional().default('EUR'),
    delta_minor: z.number().int().optional().default(0),
    kind: z.enum(['delta', 'override']).optional().default('delta'),
    override_price_minor: z.number().int().optional().nullable(),
    priority: z.number().int().optional().default(100),
    status: z.enum(['active', 'paused', 'archived']).optional().default('active'),
    metadata: z.any().optional(),
  })
  .strict();

export const GET = (req: NextRequest) =>
  withRequestId(req, async () => {
    const requestId = getRequestId(req.headers);

    const auth = await requireAdminScope(req);
    if (!auth.ok) return auth.response;

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: 'Supabase admin not configured', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    // Avoid "never" until Database typing is wired
    const res = await (admin as any)
      .from('tour_pricing_rules')
      .select('*')
      .order('priority', { ascending: true })
      .limit(200);

    if (res.error) {
      return NextResponse.json(
        { ok: false, error: res.error.message, requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    return NextResponse.json(
      { ok: true, items: res.data || [], requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  });

export const POST = (req: NextRequest) =>
  withRequestId(req, async () => {
    const requestId = getRequestId(req.headers);

    const auth = await requireAdminScope(req);
    if (!auth.ok) return auth.response;

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: 'Supabase admin not configured', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const body = CreateSchema.parse(await req.json().catch(() => ({})));

    // Guardrails por scope
    if (body.scope === 'tour' && !body.tour_id) {
      return NextResponse.json(
        { ok: false, error: 'tour_id is required when scope=tour', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }
    if (body.scope === 'tag' && !body.tag) {
      return NextResponse.json(
        { ok: false, error: 'tag is required when scope=tag', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }
    if (body.scope === 'city' && !body.city) {
      return NextResponse.json(
        { ok: false, error: 'city is required when scope=city', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const insertPayload = {
      ...body,
      metadata: body.metadata ?? {},
    };

    const res = await (admin as any)
      .from('tour_pricing_rules')
      .insert(insertPayload)
      .select('*')
      .single();

    if (res.error) {
      return NextResponse.json(
        { ok: false, error: res.error.message, requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const item = (res.data ?? null) as any;

    await logEvent('catalog.pricing_rule_created', {
      requestId,
      id: item?.id ?? null,
      scope: item?.scope ?? body.scope,
    });

    return NextResponse.json(
      { ok: true, item, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  });
