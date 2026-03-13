import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminCapability } from '@/lib/adminAuth';
import { approveOpsApproval } from '@/lib/opsApprovals.server';
import { clearChannelPause, pauseChannel } from '@/lib/channelPause.server';
import { clearRuntimeFlag, setRuntimeFlag } from '@/lib/runtimeFlags.server';
import { logEvent } from '@/lib/events.server';
import { logAudit } from '@/lib/auditLog.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const auth = await requireAdminCapability(req, 'approvals_execute');
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  // Approve (requires approver token if configured) and then execute.
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

  // NOTE: `crm_ops_approvals` may not be present in generated `Database` types.
  // Cast to `any` to avoid `never` overload errors while you align/regenerate Supabase types.
  const admin = getSupabaseAdmin() as any;
  const { data: approval, error } = await admin
    .from('crm_ops_approvals')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !approval) {
    return NextResponse.json({ ok: false, error: 'Approval not found', requestId }, { status: 404, headers: withRequestId(undefined, requestId) });
  }

  try {
    const approved = await approveOpsApproval({ id, approvedBy: 'admin' });
    if (approved.status !== 'approved') {
      return NextResponse.json({ ok: false, error: `Approval not approved: ${approved.status}`, requestId }, { status: 409, headers: withRequestId(undefined, requestId) });
    }

    const b: any = approved.payload || {};
    if (b.action === 'pause_channel') {
      await pauseChannel(b.channel, b.minutes, b.reason);
      await logEvent('ops.channel_paused', { requestId, channel: b.channel, minutes: b.minutes, reason: b.reason, approvalId: id });
    } else if (b.action === 'resume_channel') {
      await clearChannelPause(b.channel);
      await logEvent('ops.channel_resumed', { requestId, channel: b.channel, approvalId: id });
    } else if (b.action === 'set_flag') {
      await setRuntimeFlag(b.key, b.value);
      await logEvent('ops.flag_set', { requestId, key: b.key, value: b.value, approvalId: id });
    } else if (b.action === 'clear_flag') {
      await clearRuntimeFlag(b.key);
      await logEvent('ops.flag_cleared', { requestId, key: b.key, approvalId: id });
    } else {
      return NextResponse.json({ ok: false, error: 'Unsupported action', requestId }, { status: 400, headers: withRequestId(undefined, requestId) });
    }

    await logAudit({
      actor: 'admin',
      action: 'ops.approval_executed',
      requestId,
      ip: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
      entityType: 'crm_ops_approvals',
      entityId: id,
      payload: { action: b.action, executed: true },
    });

    return NextResponse.json({ ok: true, requestId, approvalId: id }, { status: 200, headers: withRequestId(undefined, requestId) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e), requestId }, { status: 500, headers: withRequestId(undefined, requestId) });
  }
}
