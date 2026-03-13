import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability } from '@/lib/adminAuth';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { issueBreakglassToken } from '@/lib/breakglass.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  actor: z.string().trim().min(1).optional(),
  reason: z.string().trim().max(200).optional(),
  ttlMinutes: z.coerce.number().int().min(1).max(60).optional().default(30),
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const auth = await requireAdminCapability(req, 'rbac_admin');
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const actor = (parsed.data.actor || auth.actor || 'admin').trim();
  const reason = parsed.data.reason;
  const ttlMinutes = parsed.data.ttlMinutes;

  const sb = getSupabaseAdmin() as any;

  // 1) Crea la solicitud (approved directo por ahora, sin two-man rule)
  const ins = await sb
    .from('crm_breakglass_requests')
    .insert({
      actor,
      reason: reason ?? null,
      ttl_minutes: ttlMinutes,
      status: 'approved',
      approval_id: null,
      decided_at: new Date().toISOString(),
      decided_by: auth.actor ?? null,
    })
    .select('*')
    .single();

  if (ins.error) {
    return NextResponse.json(
      { ok: false, requestId, error: ins.error.message || 'DB error' },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  const reqRow = ins.data;

  // 2) Emite el token
  const tok = await issueBreakglassToken({
    actor,
    ttlMinutes,
    ...(reason ? { reason } : {}),
    ...(auth.actor ? { createdBy: auth.actor } : {}),
    reqId: requestId,
  } as any);

  // tok: { token, token_hash, actor, expires_at }
  // 3) Backfill best-effort: usa token_hash (mejor) o token si no hay hash
  const tokenId = (tok as any)?.token_hash ?? (tok as any)?.token ?? null;
  if (tokenId) {
    await sb.from('crm_breakglass_requests').update({ token_id: tokenId }).eq('id', reqRow.id);
  }

  return NextResponse.json(
    { ok: true, requestId, request: reqRow, token: tok },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
