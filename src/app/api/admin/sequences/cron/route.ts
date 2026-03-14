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

function isCronAuthorized(req: NextRequest): boolean {
  // Vercel cron platform header
  if (req.headers.get('x-vercel-cron') === '1') return true;
  // Bearer token
  const expected = (
    process.env.CRON_SECRET ||
    process.env.CRON_API_TOKEN ||
    process.env.AUTOPILOT_API_TOKEN ||
    ''
  ).trim();
  if (!expected) return false;
  const token = /^Bearer\s+(.+)$/i.exec(req.headers.get('authorization') || '')?.[1]?.trim() ?? '';
  return token === expected;
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  // HMAC optional — also accept Vercel cron header / Bearer
  const hmacErr = await requireInternalHmac(req, { required: false });
  if (hmacErr && !isCronAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized', requestId },
      { status: 401, headers: withRequestId(undefined, requestId) },
    );
  }

  // Vercel cron sends empty body → safe fallback
  const rawBody = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(rawBody);
  const body = parsed.success ? parsed.data : { limit: 50, dryRun: false };

  const result = await runSequenceCron({ limit: body.limit, dryRun: body.dryRun });

  return NextResponse.json(
    { ok: true, result, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
