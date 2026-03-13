// src/app/api/admin/metrics/deals/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DealRow = {
  id: string;
  stage: string | null;
  created_at: string | null;
  updated_at: string | null;
  closed_at: string | null;
  amount_minor: number | null;
  currency: string | null;
};

const STAGES = ['new', 'qualified', 'proposal', 'checkout', 'won', 'lost'] as const;
type Stage = (typeof STAGES)[number];

function isStage(x: unknown): x is Stage {
  return typeof x === 'string' && (STAGES as readonly string[]).includes(x);
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const admin = getSupabaseAdmin();

    // P0: tu tipado no incluye 'deals' => bypass local
    const adminAny = admin as any;

    // Últimos 5000 deals y agregamos en JS (simple + robusto)
    const dealsRes = await adminAny
      .from('deals')
      .select('id,stage,created_at,updated_at,closed_at,amount_minor,currency')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (dealsRes.error) {
      await logEvent(
        'api.error',
        { requestId, route: '/api/admin/metrics/deals', message: dealsRes.error.message },
        { source: 'api' },
      );
      return NextResponse.json(
        { error: 'DB error', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    const rows = (dealsRes.data ?? []) as DealRow[];

    const totalsByStage: Record<string, number> = {};
    const amountByStageMinor: Record<string, number> = {};
    for (const s of STAGES) {
      totalsByStage[s] = 0;
      amountByStageMinor[s] = 0;
    }

    let wonCount = 0;
    let wonAmountMinor = 0;

    for (const d of rows) {
      const stage = isStage(d.stage) ? d.stage : 'new';
      totalsByStage[stage] = (totalsByStage[stage] ?? 0) + 1;

      const amt = typeof d.amount_minor === 'number' ? d.amount_minor : 0;
      amountByStageMinor[stage] = (amountByStageMinor[stage] ?? 0) + amt;

      if (stage === 'won') {
        wonCount += 1;
        wonAmountMinor += amt;
      }
    }

    return NextResponse.json(
      {
        requestId,
        window: { items_considered: rows.length, limit: 5000 },
        totalsByStage,
        amountByStageMinor,
        won: { count: wonCount, amount_minor: wonAmountMinor },
      },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/metrics/deals',
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
