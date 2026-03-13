// src/lib/opsAlerts.server.ts
import 'server-only';

import type { NextRequest } from 'next/server';

import { serverEnv } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';

export type OpsAlertPayload = {
  requestId: string;
  severity: 'info' | 'warn' | 'critical';
  kind: string;
  message: string;
  path?: string | null;
  method?: string | null;
  actor?: string | null;
  meta?: Record<string, unknown>;
};

function sevRank(s: string): number {
  if (s === 'critical') return 3;
  if (s === 'warn') return 2;
  return 1;
}

function shouldNotify(severity: OpsAlertPayload['severity']): boolean {
  const min = (serverEnv.OPS_ALERT_MIN_SEVERITY || 'critical').trim() as OpsAlertPayload['severity'];
  return sevRank(severity) >= sevRank(min);
}

function bucketKey(kind: string, ttlSeconds: number): string {
  const now = Date.now();
  const bucket = Math.floor(now / Math.max(60_000, ttlSeconds * 1000));
  return `${kind}:${bucket}`;
}

async function acquireDedupeLock(key: string): Promise<boolean> {
  try {
    const admin = getSupabaseAdmin();
    const res = await (admin as any).from('event_locks').insert({ key });
    if (!res.error) return true;
    const code = (res.error as any)?.code;
    if (code === '23505') return false;
    return true;
  } catch {
    return true; // fail-open
  }
}

async function postWebhook(url: string, payload: any) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // ignore
  }
}

async function sendEmail(to: string, subject: string, text: string) {
  try {
    const apiKey = serverEnv.RESEND_API_KEY;
    const from = serverEnv.EMAIL_FROM;
    if (!apiKey || !from) return;
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject,
      text,
      ...(serverEnv.EMAIL_REPLY_TO ? { replyTo: serverEnv.EMAIL_REPLY_TO } : {}),
    });
  } catch {
    // ignore
  }
}

/**
 * Best-effort operational alerting (webhook + email).
 * - Dedupe via event_locks bucket.
 * - Never throws.
 *
 * Supports:
 *   maybeNotifyOpsAlert(req, payload)
 *   maybeNotifyOpsAlert(payload)   // for cron/jobs without NextRequest
 */
export function maybeNotifyOpsAlert(req: NextRequest, payload: OpsAlertPayload): Promise<void>;
export function maybeNotifyOpsAlert(payload: OpsAlertPayload): Promise<void>;
export async function maybeNotifyOpsAlert(a: any, b?: any): Promise<void> {
  const req: NextRequest | null = b ? (a as NextRequest) : null;
  const payload: OpsAlertPayload = (b ? b : a) as OpsAlertPayload;

  try {
    if (!shouldNotify(payload.severity)) return;

    const ttlSeconds = Math.max(60, Number(serverEnv.OPS_ALERT_DEDUP_TTL_SECONDS || '300') || 300);
    const lock = `ops_alert:${bucketKey(payload.kind, ttlSeconds)}`;
    const ok = await acquireDedupeLock(lock);
    if (!ok) return;

    const webhookUrl = (serverEnv.OPS_ALERT_WEBHOOK_URL || '').trim();
    const emailTo = (serverEnv.OPS_ALERT_EMAIL_TO || '').trim();

    const path = payload.path ?? (req ? req.nextUrl.pathname : null);
    const method = payload.method ?? (req ? req.method.toUpperCase() : null);

    const body = {
      ts: new Date().toISOString(),
      kind: payload.kind,
      severity: payload.severity,
      message: payload.message,
      requestId: payload.requestId,
      path,
      method,
      actor: payload.actor ?? null,
      meta: payload.meta ?? {},
    };

    if (webhookUrl) void postWebhook(webhookUrl, body);
    if (emailTo) {
      const subj = `KCE OPS [${payload.severity.toUpperCase()}] ${payload.kind}`;
      const txt =
        `${subj}\n\n${payload.message}\n\n` +
        `requestId=${payload.requestId}\npath=${path ?? ''}\nmethod=${method ?? ''}\n\n` +
        `meta=${JSON.stringify(body.meta, null, 2)}`;
      void sendEmail(emailTo, subj, txt);
    }

    void logEvent(
      'ops.alert.notified',
      {
        request_id: payload.requestId,
        kind: payload.kind,
        severity: payload.severity,
        has_webhook: Boolean(webhookUrl),
        has_email: Boolean(emailTo),
      },
      { source: 'api' },
    );
  } catch {
    // swallow
  }
}
