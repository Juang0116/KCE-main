import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability } from '@/lib/adminAuth';
import { clearChannelPause, pauseChannel } from '@/lib/channelPause.server';
import { clearRuntimeFlag, setRuntimeFlag } from '@/lib/runtimeFlags.server';
import { createOpsApproval } from '@/lib/opsApprovals.server';
import { logAudit } from '@/lib/auditLog.server';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('pause_channel'),
    channel: z.string().min(1),
    minutes: z.coerce.number().int().min(1).max(7 * 24 * 60),
    reason: z.string().min(1).max(280),
  }),
  z.object({
    action: z.literal('resume_channel'),
    channel: z.string().min(1),
  }),
  z.object({
    action: z.literal('set_flag'),
    key: z.string().min(1),
    value: z.string().min(1).max(200),
  }),
  z.object({
    action: z.literal('clear_flag'),
    key: z.string().min(1),
  }),
]);

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const OPS_TWO_MAN_RULE = (process.env.OPS_TWO_MAN_RULE || '').trim() === '1' || (process.env.OPS_TWO_MAN_RULE || '').trim().toLowerCase() === 'true';
  const ttlMinutes = Number(process.env.OPS_APPROVAL_TTL_MINUTES || '15') || 15;
  const auth = await requireAdminCapability(req, 'ops_control');
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', issues: parsed.error.issues, requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  try {
    const b = parsed.data;

    // Optional dual-control (two-man rule) for critical ops actions.
    // If enabled, we create a pending approval and do NOT execute immediately.
    const isCritical =
      b.action === 'pause_channel' ||
      b.action === 'resume_channel' ||
      b.action === 'set_flag' ||
      b.action === 'clear_flag';

    if (OPS_TWO_MAN_RULE && isCritical) {
      const approval = await createOpsApproval({
        action: b.action,
        payload: b as any,
        requestId,
        requestedBy: 'admin',
        ttlMinutes,
      });

      await logAudit({
        actor: 'admin',
        action: 'ops.approval_requested',
        requestId,
        ip: req.headers.get('x-forwarded-for') || null,
        userAgent: req.headers.get('user-agent') || null,
        entityType: 'crm_ops_approvals',
        entityId: approval.id,
        payload: { action: b.action, ttlMinutes },
      });

      return NextResponse.json(
        { ok: true, pending: true, approvalId: approval.id, expiresAt: approval.expires_at, requestId },
        { status: 202, headers: withRequestId(undefined, requestId) },
      );
    }

    if (b.action === 'pause_channel') {
      await pauseChannel(b.channel, b.minutes, b.reason);
      await logEvent('ops.channel_paused', { requestId, channel: b.channel, minutes: b.minutes, reason: b.reason });
      return NextResponse.json({ ok: true, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
    }

    if (b.action === 'resume_channel') {
      await clearChannelPause(b.channel);
      await logEvent('ops.channel_resumed', { requestId, channel: b.channel });
      return NextResponse.json({ ok: true, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
    }

    if (b.action === 'set_flag') {
      await setRuntimeFlag(b.key, b.value);
      await logEvent('ops.flag_set', { requestId, key: b.key, value: b.value });
      return NextResponse.json({ ok: true, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
    }

    if (b.action === 'clear_flag') {
      await clearRuntimeFlag(b.key);
      await logEvent('ops.flag_cleared', { requestId, key: b.key });
      return NextResponse.json({ ok: true, requestId }, { status: 200, headers: withRequestId(undefined, requestId) });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported action', requestId }, { status: 400, headers: withRequestId(undefined, requestId) });
  } catch (e) {
    await logEvent('api.error', { requestId, route: '/api/admin/ops/control', error: String(e) });
    return NextResponse.json(
      { ok: false, error: 'Failed', requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
