import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  runId: z.string().min(6),
  stepId: z.string().min(2),
  status: z.enum(['todo', 'pass', 'fail']),
  notes: z.string().optional().default(''),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const reqId = getRequestId(req.headers);
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400, headers: { 'X-Request-ID': reqId } },
    );
  }

  const { runId, stepId, status, notes } = parsed.data;

  // Deduplicate per run + step + status to avoid spam on repeated clicks.
  const dedupeKey = `runbook:${runId}:${stepId}:${status}`;

  await logEvent(
    'qa.runbook_step',
    {
      request_id: reqId,
      run_id: runId,
      step_id: stepId,
      status,
      notes: notes?.slice(0, 2000) ?? '',
    },
    { source: 'qa', dedupeKey },
  );

  return NextResponse.json(
    { ok: true, requestId: reqId },
    { headers: { 'X-Request-ID': reqId, 'Cache-Control': 'no-store' } },
  );
}
