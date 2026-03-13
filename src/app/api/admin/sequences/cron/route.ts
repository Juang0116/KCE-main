// src/app/api/admin/sequences/cron/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireInternalHmac } from '@/lib/internalHmac.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { runSequenceCron } from '@/lib/sequences.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
    dryRun: z.boolean().optional().default(false),
  })
  .strict();

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  await requireInternalHmac(req);

  const body = BodySchema.parse(await req.json().catch(() => ({})));
  const result = await runSequenceCron({ limit: body.limit, dryRun: body.dryRun });

  return NextResponse.json(
    { ok: true, result, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
