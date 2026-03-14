// src/app/api/admin/agents/route.ts
// Manual trigger for KCE AI agents — for testing and admin use.
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { runOpsAgent } from '@/lib/opsAgent.server';
import { runReviewAgent } from '@/lib/reviewAgent.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  agent: z.enum(['ops', 'review', 'all']),
  dryRun: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const { agent, dryRun } = parsed.data;
  const results: Record<string, unknown> = {};

  if ((agent === 'ops' || agent === 'all') && !dryRun) {
    results.ops = await runOpsAgent(requestId).catch((e) => ({ error: e?.message }));
  }

  if ((agent === 'review' || agent === 'all') && !dryRun) {
    results.review = await runReviewAgent(requestId).catch((e) => ({ error: e?.message }));
  }

  if (dryRun) {
    results.dryRun = true;
    results.message = `Would run: ${agent}. No emails sent.`;
  }

  return NextResponse.json(
    { ok: true, requestId, results },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
