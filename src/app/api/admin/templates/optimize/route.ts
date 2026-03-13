import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { runTemplateOptimization } from '@/lib/templateOptimization.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z
  .object({
    days: z.coerce.number().int().min(7).max(180).optional().default(30),
    limit: z.coerce.number().int().min(500).max(15000).optional().default(8000),
    minSamples: z.coerce.number().int().min(10).max(500).optional().default(40),
    lockDays: z.coerce.number().int().min(3).max(21).optional().default(7),
    applyWeights: z.boolean().optional().default(true),
  })
  .strict();

export async function POST(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const bodyJson = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Bad body', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const { days, limit, minSamples, lockDays, applyWeights } = parsed.data;

  const result = await runTemplateOptimization({
    requestId,
    days,
    limit,
    minSamples,
    lockDays,
    applyWeights,
    source: 'admin',
  });

  return NextResponse.json({ ok: true, requestId, result }, { status: 200, headers: withRequestId(undefined, requestId) });
}
