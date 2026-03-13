// src/lib/securityEvents.server.ts
import 'server-only';

import type { NextRequest } from 'next/server';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId } from '@/lib/requestId';
import { maybeNotifySecurityAlert } from '@/lib/securityAlerts.server';

export type SecurityEventInput = {
  severity: 'info' | 'warn' | 'critical';
  kind: string; // e.g. 'rate_limit', 'signed_action_invalid'
  actor?: string | null;
  meta?: Record<string, unknown>;
};

function pickIp(req: NextRequest): string {
  const xf = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim();
  const xr = (req.headers.get('x-real-ip') || '').trim();
  return xf || xr || '';
}

/**
 * Best-effort security telemetry.
 * - Inserts into public.security_events when available.
 * - Optionally notifies (webhook/email) for high severity events.
 * - Never throws.
 */
export async function logSecurityEvent(req: NextRequest, input: SecurityEventInput): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return;

    const requestId = getRequestId(req.headers);
    const ip = pickIp(req);
    const ua = (req.headers.get('user-agent') || '').slice(0, 400);

    await (admin as any).from('security_events').insert({
      request_id: requestId,
      severity: input.severity,
      kind: input.kind,
      actor: input.actor ?? null,
      path: req.nextUrl.pathname,
      method: req.method.toUpperCase(),
      ip: ip || null,
      user_agent: ua || null,
      meta: input.meta ?? {},
    });

    // Notification is best-effort; we do it after persistence.
    void maybeNotifySecurityAlert(req, {
      requestId,
      ip,
      userAgent: ua,
      severity: input.severity,
      kind: input.kind,
      actor: input.actor ?? null,
      path: req.nextUrl.pathname,
      method: req.method.toUpperCase(),
      meta: input.meta ?? {},
    });
  } catch {
    // swallow
  }
}
