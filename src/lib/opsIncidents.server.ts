// src/lib/opsIncidents.server.ts
import 'server-only';

import type { NextRequest } from 'next/server';
import { createHash } from 'crypto';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId } from '@/lib/requestId';
import { maybeNotifyOpsAlert } from '@/lib/opsAlerts.server';
import { maybeTripOpsCircuit } from '@/lib/opsCircuitBreaker.server';

export type OpsIncidentInput = {
  severity: 'info' | 'warn' | 'critical';
  kind: string; // e.g. 'checkout_error', 'stripe_webhook_error', 'email_send_error'
  message: string;
  actor?: string | null;
  fingerprint?: string | null;
  meta?: Record<string, unknown>;
};

function pickIp(req: NextRequest): string {
  const xf = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim();
  const xr = (req.headers.get('x-real-ip') || '').trim();
  return xf || xr || '';
}

function hash(s: string) {
  return createHash('sha256').update(s).digest('hex').slice(0, 48);
}

function normalizeFingerprint(kind: string, fingerprint?: string | null, meta?: Record<string, unknown>): string {
  const base = (fingerprint || '').trim();
  if (base) return `${kind}:${base}`.slice(0, 200);
  // Stable-ish by kind + a few meta hints.
  const hint = JSON.stringify({ kind, m: meta || {} });
  return `${kind}:${hash(hint)}`.slice(0, 200);
}

function sevRank(s: string): number {
  if (s === 'critical') return 3;
  if (s === 'warn') return 2;
  return 1;
}

function maxSeverity(a: string, b: string) {
  return sevRank(a) >= sevRank(b) ? a : b;
}

/**
 * Best-effort operational incidents:
 * - Upsert-like behavior via fingerprint.
 * - Increments count + bumps last_seen_at.
 * - Optionally triggers ops notifications (webhook/email).
 * - Never throws.
 */
export async function logOpsIncident(req: NextRequest, input: OpsIncidentInput): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return;

    const requestId = getRequestId(req.headers);
    const ip = pickIp(req);
    const ua = (req.headers.get('user-agent') || '').slice(0, 400);

    const fingerprint = normalizeFingerprint(input.kind, input.fingerprint, input.meta);

    // Try load existing
    const existing = await (admin as any)
      .from('ops_incidents')
      .select('id,count,severity,status')
      .eq('fingerprint', fingerprint)
      .maybeSingle();

    if (!existing?.error && existing.data?.id) {
      const curCount = Number(existing.data.count ?? 1) || 1;
      const curSeverity = String(existing.data.severity || input.severity);
      const nextSeverity = maxSeverity(curSeverity, input.severity);
      await (admin as any)
        .from('ops_incidents')
        .update({
          severity: nextSeverity,
          message: input.message,
          meta: input.meta ?? {},
          count: curCount + 1,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(existing.data.status === 'resolved' ? { status: 'open', resolved_at: null, acknowledged_at: null } : {}),
        })
        .eq('id', existing.data.id);
    } else {
      await (admin as any).from('ops_incidents').insert({
        request_id: requestId,
        severity: input.severity,
        kind: input.kind,
        actor: input.actor ?? null,
        path: req.nextUrl.pathname,
        method: req.method.toUpperCase(),
        ip: ip || null,
        user_agent: ua || null,
        message: input.message,
        fingerprint,
        meta: input.meta ?? {},
        status: 'open',
        count: 1,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      });
    }

    // Notify (best-effort) after persistence.
    void maybeNotifyOpsAlert(req, {
      requestId,
      severity: input.severity,
      kind: input.kind,
      message: input.message,
      actor: input.actor ?? null,
      path: req.nextUrl.pathname,
      method: req.method.toUpperCase(),
      meta: { fingerprint, ...(input.meta ?? {}) },
    });

    // Auto-mitigation (best-effort): trip circuit breaker on spikes.
    void maybeTripOpsCircuit(req, { kind: input.kind, severity: input.severity });
  } catch {
    // swallow
  }
}
