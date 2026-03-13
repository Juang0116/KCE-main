// src/app/api/admin/metrics/funnel-stages/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { computeFunnelStages } from '@/lib/funnelStages.server';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z
  .object({
    days: z.coerce.number().int().min(1).max(90).optional().default(30),
    limit: z.coerce.number().int().min(50).max(5000).optional().default(1000),
    openWindowDays: z.coerce.number().int().min(1).max(30).optional().default(14),
  })
  .strict();

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  try {
    const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad query', details: parsed.error.flatten(), requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const data = await computeFunnelStages(parsed.data);
    return NextResponse.json(
      { ...data, requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: any) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/metrics/funnel-stages', message: String(e?.message || 'unknown') },
      { source: 'api' },
    );

    return NextResponse.json(
      { error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
