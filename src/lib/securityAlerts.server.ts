// src/lib/securityAlerts.server.ts
import 'server-only';

import type { NextRequest } from 'next/server';
import { Resend } from 'resend';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { serverEnv } from '@/lib/env';

export type SecurityAlertPayload = {
  requestId: string;
  severity: 'info' | 'warn' | 'critical';
  kind: string;
  actor: string | null;
  path: string;
  method: string;
  ip: string;
  userAgent: string;
  meta: Record<string, unknown>;
};

function severityRank(s: SecurityAlertPayload['severity']): number {
  return s === 'critical' ? 3 : s === 'warn' ? 2 : 1;
}

function minSeverity(): SecurityAlertPayload['severity'] {
  const v = (process.env.SECURITY_ALERT_MIN_SEVERITY || '').trim().toLowerCase();
  if (v === 'info' || v === 'warn' || v === 'critical') return v;
  return 'critical';
}

async function tryAcquireAlertLock(kind: string, ttlSeconds: number): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return true; // fail open

  // Bucketed lock: avoids spamming alerts.
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / Math.max(60, Math.min(ttlSeconds, 900)));
  const keyBase = `sec_alert:${kind}:${bucket}`;

  const nowIso = new Date().toISOString();
  const expIso = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  const attempts: Array<Record<string, any>> = [
    { key: keyBase, scope: 'global', acquired_at: nowIso, expires_at: expIso, meta: { kind } },
    { key: keyBase, expires_at: expIso },
    { key: keyBase, created_at: nowIso },
    { key: keyBase },
  ];

  for (const payload of attempts) {
    const r = await admin.from('event_locks').insert(payload as any).select('key').maybeSingle();
    if (!r.error && r.data?.key) return true;

    const msg = (r.error as any)?.message || '';
    // Unique/conflict: lock already exists
    if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) return false;

    // If schema mismatch, try next payload.
    const schemaMismatch =
      msg.includes('does not exist') ||
      msg.includes('violates not-null constraint') ||
      msg.includes('column');
    if (!schemaMismatch) return false;
  }

  return false;
}

async function postWebhook(url: string, body: any): Promise<void> {
  // Best-effort
  await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}

async function sendAlertEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = (serverEnv.RESEND_API_KEY || '').trim();
  const from = (serverEnv.EMAIL_FROM || '').trim();
  if (!apiKey || !from) return;

  const replyTo = (serverEnv.EMAIL_REPLY_TO || '').trim() || undefined;
  const resend = new Resend(apiKey);

  const args: any = { from, to: [to], subject, html };
  if (replyTo) args.replyTo = replyTo;

  await resend.emails.send(args);
}

function escapeHtml(s: string): string {
  return String(s || '').replace(
    /[&<>"']/g,
    (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] as string),
  );
}

function buildEmailHtml(p: SecurityAlertPayload): string {
  return `
<div style="font-family: ui-sans-serif, system-ui, -apple-system; line-height:1.5">
  <h2 style="margin:0 0 8px 0">KCE Security Alert</h2>
  <div><b>severity:</b> ${escapeHtml(p.severity)}</div>
  <div><b>kind:</b> ${escapeHtml(p.kind)}</div>
  <div><b>actor:</b> ${escapeHtml(p.actor || '')}</div>
  <div><b>request_id:</b> ${escapeHtml(p.requestId)}</div>
  <div><b>route:</b> ${escapeHtml(p.method)} ${escapeHtml(p.path)}</div>
  <div><b>ip:</b> ${escapeHtml(p.ip)}</div>
  <div><b>ua:</b> ${escapeHtml(p.userAgent)}</div>
  <pre style="margin-top:12px; padding:12px; background:#f7f7f7; border:1px solid #eee; border-radius:8px; overflow:auto">${escapeHtml(
    JSON.stringify(p.meta || {}, null, 2),
  )}</pre>
</div>`;
}

/**
 * Best-effort notifications for high severity security events.
 * - Uses a bucketed lock in event_locks to reduce spam.
 * - Never throws.
 */
export async function maybeNotifySecurityAlert(req: NextRequest, payload: SecurityAlertPayload): Promise<void> {
  try {
    const min = minSeverity();
    if (severityRank(payload.severity) < severityRank(min)) return;

    const webhook = (process.env.SECURITY_ALERT_WEBHOOK_URL || '').trim();
    const emailTo = (process.env.SECURITY_ALERT_EMAIL_TO || '').trim();
    if (!webhook && !emailTo) return;

    // Don't spam: acquire a short-lived lock per kind.
    const ttl = Math.max(60, Math.min(Number(process.env.SECURITY_ALERT_DEDUP_TTL_SECONDS || 300) || 300, 1800));
    const ok = await tryAcquireAlertLock(payload.kind, ttl);
    if (!ok) return;

    const body = {
      ts: new Date().toISOString(),
      requestId: payload.requestId,
      severity: payload.severity,
      kind: payload.kind,
      actor: payload.actor,
      path: payload.path,
      method: payload.method,
      ip: payload.ip,
      userAgent: payload.userAgent,
      meta: payload.meta,
      // Convenience flags
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    };

    // Webhook (Slack/Discord/custom)
    if (webhook) {
      try {
        await postWebhook(webhook, body);
      } catch {
        // ignore
      }
    }

    // Email
    if (emailTo) {
      try {
        const subject = `[KCE] SECURITY ${payload.severity.toUpperCase()} — ${payload.kind}`;
        await sendAlertEmail(emailTo, subject, buildEmailHtml(payload));
      } catch {
        // ignore
      }
    }
  } catch {
    // swallow
  }
}
