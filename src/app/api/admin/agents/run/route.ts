// src/app/api/admin/agents/run/route.ts
import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdminScope } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { runOpsAgent } from '@/lib/opsAgent.server';
import { runReviewAgent } from '@/lib/reviewAgent.server';
import { runSalesAgent } from '@/lib/salesAgent.server';
import { runContentAgent } from '@/lib/contentAgent.server';
import { runAnalyticsAgent } from '@/lib/analyticsAgent.server';
import { runTrainerAgent } from '@/lib/trainerAgent.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const AGENTS = ['ops', 'review', 'sales', 'content', 'analytics', 'trainer', 'all'] as const;
const BodySchema = z.object({ agent: z.enum(AGENTS), dryRun: z.boolean().optional().default(false) });

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid body', requestId }, { status: 400, headers: withRequestId(undefined, requestId) });

  const { agent, dryRun } = parsed.data;
  if (dryRun) return NextResponse.json({ ok: true, requestId, results: { message: `Would run: ${agent}`, dryRun: true } }, { status: 200, headers: withRequestId(undefined, requestId) });

  const results: Record<string, unknown> = {};
  const run = async (name: string, fn: () => Promise<unknown>) => {
    try { results[name] = await fn(); } catch (e: any) { results[name] = { error: e?.message }; }
  };

  if (agent === 'ops'       || agent === 'all') await run('ops',       () => runOpsAgent(requestId));
  if (agent === 'review'    || agent === 'all') await run('review',    () => runReviewAgent(requestId));
  if (agent === 'sales'     || agent === 'all') await run('sales',     () => runSalesAgent(requestId));
  if (agent === 'analytics' || agent === 'all') await run('analytics', () => runAnalyticsAgent(requestId));
  if (agent === 'content'   || agent === 'all') await run('content',   () => runContentAgent(requestId));
  if (agent === 'trainer'   || agent === 'all') await run('trainer',   () => runTrainerAgent(requestId));

  return NextResponse.json({ ok: true, requestId, results }, { status: 200, headers: withRequestId(undefined, requestId) });
}
