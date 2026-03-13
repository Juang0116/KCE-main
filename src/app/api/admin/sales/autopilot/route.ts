// src/app/api/admin/sales/autopilot/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { runAutopilot } from '@/lib/autopilot.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z
  .object({
    // if true, only returns what it WOULD do (no writes)
    dryRun: z.boolean().optional().default(false),
    // optional filter
    stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'checkout']).optional(),
    limit: z.coerce.number().int().min(10).max(500).optional().default(200),
  })
  .strict();

export async function POST(req: NextRequest) {
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const bodyJson = await req.json().catch(() => ({}));
  const body = BodySchema.safeParse(bodyJson);
  if (!body.success) {
    return NextResponse.json(
      { ok: false, error: 'Bad body', details: body.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const { dryRun, stage, limit } = body.data;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Supabase admin not configured', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  try {
    // exactOptionalPropertyTypes: DO NOT pass stage when undefined
    const params = {
      admin: admin as any,
      requestId,
      dryRun,
      limit,
      source: 'admin' as const,
      ...(stage ? { stage } : {}),
    };

    const { dealsProcessed, tasksCreated, created, skipped } = await runAutopilot(params as any);

    return NextResponse.json(
      {
        ok: true,
        requestId,
        dryRun,
        stage: stage ?? null,
        limit,
        dealsProcessed,
        tasksCreated,
        created: (created ?? []).slice(0, 100),
        skipped: (skipped ?? []).slice(0, 100),
      },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      { requestId, route: '/api/admin/sales/autopilot', message: e instanceof Error ? e.message : 'unknown' },
      { source: 'api' },
    );
    return NextResponse.json(
      { ok: false, error: 'Unexpected error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
