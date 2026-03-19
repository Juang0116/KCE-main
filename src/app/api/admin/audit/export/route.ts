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
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const AGENTS = ['ops', 'review', 'sales', 'content', 'analytics', 'trainer', 'all'] as const;
const BodySchema = z.object({ 
  agent: z.enum(AGENTS), 
  dryRun: z.boolean().optional().default(false) 
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid body', requestId }, { status: 400 });

  const { agent, dryRun } = parsed.data;
  if (dryRun) return NextResponse.json({ ok: true, requestId, results: { dryRun: true, agent } });

  const results: Record<string, any> = {};
  const run = async (name: string, fn: () => Promise<any>) => {
    try { results[name] = await fn(); } catch (e: any) { results[name] = { error: e?.message }; }
  };

  const tasks: Promise<void>[] = [];
  if (agent === 'ops' || agent === 'all') tasks.push(run('ops', () => runOpsAgent(requestId)));
  if (agent === 'review' || agent === 'all') tasks.push(run('review', () => runReviewAgent(requestId)));
  if (agent === 'sales' || agent === 'all') tasks.push(run('sales', () => runSalesAgent(requestId)));
  if (agent === 'analytics' || agent === 'all') tasks.push(run('analytics', () => runAnalyticsAgent(requestId)));
  if (agent === 'content' || agent === 'all') tasks.push(run('content', () => runContentAgent(requestId)));
  if (agent === 'trainer' || agent === 'all') tasks.push(run('trainer', () => runTrainerAgent(requestId)));

  await Promise.all(tasks);

  // Fix Error 2379: userId: string | null
  void logEvent('admin.agents_run', { agent, resultsCount: Object.keys(results).length }, { userId: auth.actor ?? null });

  return NextResponse.json({ ok: true, requestId, results }, { status: 200, headers: withRequestId(undefined, requestId) });
}