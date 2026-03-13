// src/lib/opsCircuitBreaker.server.ts
import 'server-only';

import type { NextRequest } from 'next/server';

import { getSupabaseAdminAny } from '@/lib/supabaseAdminAny.server';
import { getRequestId } from '@/lib/requestId';
import { logSecurityEvent } from '@/lib/securityEvents.server';
import { clearChannelPause, getChannelPause, pauseChannelSeconds } from '@/lib/channelPause.server';

export type OpsChannel = 'checkout' | 'email';

function addSecondsIso(seconds: number) {
  return new Date(Date.now() + Math.max(0, seconds) * 1000).toISOString();
}

export async function getOpsPause(
  channel: OpsChannel,
): Promise<{ paused: boolean; pausedUntil?: string; reason?: string | null }> {
  const info = await getChannelPause(channel);
  if (!info) return { paused: false };
  return { paused: true, pausedUntil: info.paused_until, reason: info.reason ?? null };
}

export async function pauseOpsChannel(
  req: NextRequest,
  channel: OpsChannel,
  seconds: number,
  reason: string,
): Promise<void> {
  const rid = getRequestId(req.headers);

  // Persist pause in the unified pause store (crm_channel_pauses),
  // so Ops UI and runtime checks see the same source of truth.
  await pauseChannelSeconds(channel, seconds, reason);

  // NOTE: SecurityEventInput does NOT include `message` in this codebase.
  // Use meta.note as the human-readable text.
  await logSecurityEvent(req, {
    severity: 'warn',
    kind: 'ops_pause_set',
    actor: 'system',
    meta: {
      note: `Ops circuit paused ${channel} until ${addSecondsIso(seconds)}`,
      channel,
      seconds,
      reason,
      requestId: rid,
    },
  });
}

export async function clearOpsChannelPause(req: NextRequest, channel: OpsChannel): Promise<void> {
  const rid = getRequestId(req.headers);

  await clearChannelPause(channel);

  await logSecurityEvent(req, {
    severity: 'info',
    kind: 'ops_pause_cleared',
    actor: 'system',
    meta: {
      note: `Ops pause cleared for ${channel}`,
      channel,
      requestId: rid,
    },
  });
}

/**
 * Circuit breaker: if incident volume spikes, pause a channel for a short window.
 * Uses ops_incidents (aggregated) as a proxy for "blast radius".
 */
export async function maybeTripOpsCircuit(
  req: NextRequest,
  input: { kind: string; severity: 'info' | 'warn' | 'critical' },
) {
  const enabled = String(process.env.OPS_CIRCUIT_ENABLED || '1').toLowerCase() !== '0';
  if (!enabled) return;
  if (input.severity === 'info') return;

  const channel: OpsChannel | null = input.kind.includes('email')
    ? 'email'
    : input.kind.includes('checkout')
      ? 'checkout'
      : null;
  if (!channel) return;

  const threshold = Math.max(1, Number(process.env.OPS_CIRCUIT_THRESHOLD || 8));
  const windowSeconds = Math.max(60, Number(process.env.OPS_CIRCUIT_WINDOW_SECONDS || 300));
  const pauseSeconds = Math.max(60, Number(process.env.OPS_CIRCUIT_PAUSE_SECONDS || 600));

  const already = await getOpsPause(channel);
  if (already.paused) return;

  const admin = getSupabaseAdminAny();
  const sinceIso = addSecondsIso(-windowSeconds);

  // Count incidents in window for the relevant channel family.
  const kindPrefix = channel === 'email' ? 'email' : 'checkout';

  const q = await admin
    .from('ops_incidents')
    .select('count,kind,updated_at,created_at')
    .gte('updated_at', sinceIso)
    .ilike('kind', `%${kindPrefix}%`);

  const rows = Array.isArray((q as any)?.data) ? (q as any).data : [];
  const total = rows.reduce((sum: number, r: any) => sum + (Number(r?.count ?? 1) || 1), 0);

  if (total < threshold) return;

  await pauseOpsChannel(
    req,
    channel,
    pauseSeconds,
    `auto: ${channel} total=${total} window=${windowSeconds}s (kind=${input.kind})`,
  );
}

/**
 * Use in routes before doing expensive work.
 */
export async function assertOpsNotPaused(
  req: NextRequest,
  channel: OpsChannel,
): Promise<{ ok: true } | { ok: false; pausedUntil?: string | null; reason?: string | null }> {
  const pause = await getOpsPause(channel);
  if (!pause.paused) return { ok: true };
  return { ok: false, pausedUntil: pause.pausedUntil ?? null, reason: pause.reason ?? null };
}
