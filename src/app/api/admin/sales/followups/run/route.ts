// src/app/api/admin/sales/followups/run/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { runCheckoutCohortFollowups } from '@/lib/conversionFollowups.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z
  .object({
    dryRun: z.boolean().optional().default(false),
    limit: z.coerce.number().int().min(10).max(2000).optional().default(400),
  })
  .strict();

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const bodyJson = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Bad body', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const { dryRun, limit } = parsed.data;

  try {
    // ✅ FIX: source debe ser "cron" | "manual"
    const result = await runCheckoutCohortFollowups({
      requestId,
      dryRun,
      limit,
      source: 'manual',
    });

    return NextResponse.json(
      { ok: true, requestId, result },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
