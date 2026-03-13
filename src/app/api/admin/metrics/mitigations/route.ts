// src/app/api/admin/metrics/mitigations/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { runMitigations } from '@/lib/mitigations.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  dryRun: z.coerce.boolean().optional().default(true),
});

const BodySchema = z
  .object({
    fired: z.array(z.any()).default([]), // si tienes un tipo estricto de alert, cámbialo aquí
    dryRun: z.coerce.boolean().optional().default(true),
  })
  .strict();

export async function GET(req: NextRequest) {
  const auth = await requireAdminScope(req); // ✅ await
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid query', issues: parsed.error.issues, requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  // GET típico: no ejecuta nada si no hay payload; devuelve “how-to”
  return NextResponse.json(
    { ok: true, dryRun: parsed.data.dryRun, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminScope(req); // ✅ await
  if (!auth.ok) return auth.response;

  const requestId = getRequestId(req.headers);

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  try {
    const mitigations = await runMitigations(parsed.data.fired as any, {
      dryRun: parsed.data.dryRun,
      requestId,
    });

    await logEvent(
      'mitigations.run',
      { requestId, dryRun: parsed.data.dryRun, fired: parsed.data.fired.length, mitigations: mitigations?.length ?? 0 },
      { source: 'admin' },
    );

    return NextResponse.json(
      { ok: true, dryRun: parsed.data.dryRun, items: mitigations ?? [], requestId },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (e: unknown) {
    await logEvent(
      'api.error',
      {
        requestId,
        route: '/api/admin/metrics/mitigations',
        message: e instanceof Error ? e.message : 'unknown',
      },
      { source: 'api' },
    );
    return NextResponse.json(
      { ok: false, error: 'Internal error', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
