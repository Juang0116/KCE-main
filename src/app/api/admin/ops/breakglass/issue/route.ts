// src/app/api/admin/ops/breakglass/issue/route.ts
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability } from '@/lib/adminAuth';
import { issueBreakglassToken } from '@/lib/rbac.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  actor: z.string().min(1),
  reason: z.string().min(1).max(200).optional(),
  ttlMinutes: z.number().int().min(1).max(60).optional(),
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminCapability(req, 'ops_control');
  if (!auth.ok) return auth.response;

  // Optional: second-factor approver token for issuing breakglass
  const issuerToken = (process.env.OPS_BREAKGLASS_ISSUER_TOKEN || '').trim();
  if (issuerToken) {
    const provided = (req.headers.get('x-ops-approver-token') || '').trim();
    if (!provided || provided !== issuerToken) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Forbidden' },
        { status: 403, headers: withRequestId(undefined, requestId) },
      );
    }
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const reason = parsed.data.reason?.trim();

  // exactOptionalPropertyTypes: don't pass `createdBy: undefined`.
  // Some call-sites type `auth.actor` as possibly undefined; normalize & conditionally include.
  const createdBy = typeof (auth as any)?.actor === 'string' ? String((auth as any).actor).trim() : '';

  const { token, expires_at } = await issueBreakglassToken({
    actor: parsed.data.actor,
    ttlMinutes: parsed.data.ttlMinutes ?? 10,
    ...(createdBy ? { createdBy } : {}),
    ...(reason ? { reason } : {}),
  });

  return NextResponse.json(
    { ok: true, requestId, token, expiresAt: expires_at },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
