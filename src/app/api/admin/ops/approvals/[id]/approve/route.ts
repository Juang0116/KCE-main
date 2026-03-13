import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminCapability } from '@/lib/adminAuth';
import { approveOpsApproval } from '@/lib/opsApprovals.server';
import { logAudit } from '@/lib/auditLog.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const auth = await requireAdminCapability(req, 'approvals_execute');
  if (!auth.ok) return auth.response;

  const OPS_APPROVER_TOKEN = (process.env.OPS_APPROVER_TOKEN || '').trim();
  if (OPS_APPROVER_TOKEN) {
    const provided = (req.headers.get('x-ops-approver-token') || '').trim();
    if (!provided || provided !== OPS_APPROVER_TOKEN) {
      return NextResponse.json(
        { ok: false, error: 'Missing/invalid approver token', requestId },
        { status: 403, headers: withRequestId(undefined, requestId) },
      );
    }
  }

  const { id } = await ctx.params;

  try {
    const approved = await approveOpsApproval({ id, approvedBy: 'admin' });
    await logAudit({
      actor: 'admin',
      action: 'ops.approval_approved',
      requestId,
      ip: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
      entityType: 'crm_ops_approvals',
      entityId: id,
      payload: { status: approved.status },
    });
    return NextResponse.json({ ok: true, approval: approved, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e), requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
