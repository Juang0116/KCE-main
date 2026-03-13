import 'server-only';

import { logEvent } from '@/lib/events.server';
import { sendOpsDigestEmail } from '@/services/opsDigestEmail';

type NotifyPayload = {
  title: string;
  severity: 'info' | 'warn' | 'critical';
  text: string;
  meta?: Record<string, unknown>;
};

async function postJson(url: string, body: unknown): Promise<void> {
  const u = (url || '').trim();
  if (!u) return;
  await fetch(u, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function notifySlack(p: NotifyPayload): Promise<void> {
  const url = (process.env.OPS_SLACK_WEBHOOK_URL || process.env.OPS_ALERT_WEBHOOK_URL || '').trim();
  if (!url) return;

  const payload = {
    text: `*${p.severity.toUpperCase()}* — ${p.title}\n${p.text}`,
  };

  await postJson(url, payload);
}

async function notifyEmail(p: NotifyPayload): Promise<void> {
  const to = (process.env.OPS_NOTIFY_EMAIL_TO || process.env.OPS_ALERT_EMAIL_TO || '').trim();
  if (!to) return;

  const subject = `[KCE OPS] ${p.severity.toUpperCase()} — ${p.title}`;
  const html = `<div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <h2 style="margin:0 0 8px 0">${escapeHtml(p.title)}</h2>
    <p><b>Severity:</b> ${escapeHtml(p.severity)}</p>
    <pre style="background:#f5f5f5;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(p.text)}</pre>
    ${p.meta ? `<pre style="background:#f5f5f5;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(JSON.stringify(p.meta, null, 2))}</pre>` : ''}
  </div>`;

  await sendOpsDigestEmail({ to, subject, html });
}

function escapeHtml(s: string): string {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Optional WhatsApp via CallMeBot (simple).
 * Env:
 * - OPS_CALLMEBOT_PHONE: e.g. +57xxxxxxxxxx
 * - OPS_CALLMEBOT_APIKEY: provided by CallMeBot
 */
async function notifyWhatsAppCallMeBot(p: NotifyPayload): Promise<void> {
  const phone = (process.env.OPS_CALLMEBOT_PHONE || '').trim();
  const apikey = (process.env.OPS_CALLMEBOT_APIKEY || '').trim();
  if (!phone || !apikey) return;

  const msg = encodeURIComponent(`[${p.severity.toUpperCase()}] ${p.title}\n${p.text}`);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${msg}&apikey=${encodeURIComponent(apikey)}`;
  await fetch(url, { method: 'GET' });
}

export async function notifyOps(p: NotifyPayload): Promise<void> {
  // Best-effort fan-out
  try { await notifySlack(p); } catch {}
  try { await notifyEmail(p); } catch {}
  try { await notifyWhatsAppCallMeBot(p); } catch {}

  try {
    await logEvent('ops.notify', { severity: p.severity, title: p.title, meta: p.meta ?? null });
  } catch {}
}
