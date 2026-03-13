'use client';

import { useMemo, useState } from 'react';

import { adminFetch } from '@/lib/adminFetch.client';

type Resp = {
  ok: boolean;
  channels: { webhook: boolean; email: boolean; whatsapp: boolean };
  requestId?: string;
  error?: string;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export function AdminOpsNotificationsClient() {
  const [severity, setSeverity] = useState<'info' | 'warn' | 'critical'>('warn');
  const [title, setTitle] = useState('Test OPS Alert');
  const [message, setMessage] = useState('This is a test ops notification from KCE.');
  const [busy, setBusy] = useState(false);
  const [resp, setResp] = useState<Resp | null>(null);

  const preview = useMemo(() => {
    return `[${severity.toUpperCase()}] ${title}\n${message}`;
  }, [severity, title, message]);

  async function send() {
    setBusy(true);
    setResp(null);
    try {
      const r = await adminFetch('/api/admin/ops/notify/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ severity, title, message }),
      });
      const j = (await r.json().catch(() => ({}))) as Resp;
      if (!r.ok) {
        setResp({ ok: false, channels: (j as any).channels || { webhook: false, email: false, whatsapp: false }, error: (j as any).error || 'Error' });
        return;
      }
      setResp(j);
    } catch (e: any) {
      setResp({ ok: false, channels: { webhook: false, email: false, whatsapp: false }, error: e?.message || 'Error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Ops Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Env-based health check + one-click test for Slack/Discord webhook, email, and optional WhatsApp (CallMeBot).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-3">
            <label className="text-sm font-medium">Severity</label>
            <div className="mt-2 flex gap-2">
              {(['info', 'warn', 'critical'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={cls(
                    'rounded-xl border px-3 py-2 text-sm',
                    severity === s && 'bg-primary text-primary-foreground',
                  )}
                  onClick={() => setSeverity(s)}
                  disabled={busy}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              disabled={busy}
            />
          </div>

          <div className="mb-3">
            <label className="text-sm font-medium">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-2 h-28 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              disabled={busy}
            />
          </div>

          <button
            type="button"
            onClick={send}
            disabled={busy}
            className="w-full rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? 'Sending…' : 'Send test notification'}
          </button>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <h2 className="text-base font-semibold">Result</h2>

          <div className="mt-3 rounded-xl border bg-muted p-3">
            <pre className="whitespace-pre-wrap text-xs">{preview}</pre>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="rounded-xl border p-3">
              <div className="font-medium">Channels configured</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {/* exactOptionalPropertyTypes: never pass `undefined` explicitly */}
                <Badge label="Webhook" ok={Boolean(resp?.channels?.webhook)} />
                <Badge label="Email" ok={Boolean(resp?.channels?.email)} />
                <Badge label="WhatsApp" ok={Boolean(resp?.channels?.whatsapp)} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Webhook uses <code>OPS_SLACK_WEBHOOK_URL</code> or fallback <code>OPS_ALERT_WEBHOOK_URL</code>. Email uses <code>OPS_NOTIFY_EMAIL_TO</code> or fallback <code>OPS_ALERT_EMAIL_TO</code>.
              </p>
            </div>

            <div className="rounded-xl border p-3">
              <div className="font-medium">Delivery</div>
              {resp ? (
                <p className={cls('mt-2 text-sm', resp.ok ? 'text-emerald-700' : 'text-red-700')}>
                  {resp.ok ? 'OK — notification sent (best-effort).' : `Failed — ${resp.error || 'unknown error'}`}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Press “Send test notification” to validate your configuration.</p>
              )}

              {resp?.requestId ? (
                <p className="mt-1 text-xs text-muted-foreground">requestId: <code>{resp.requestId}</code></p>
              ) : null}
            </div>

            <div className="rounded-xl border p-3">
              <div className="font-medium">Next steps</div>
              <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                <li>If webhook is off: set OPS_ALERT_WEBHOOK_URL (Slack/Discord) and re-test.</li>
                <li>If email is off: set OPS_ALERT_EMAIL_TO (or OPS_NOTIFY_EMAIL_TO) and confirm Resend is configured.</li>
                <li>If WhatsApp is off: set OPS_CALLMEBOT_PHONE and OPS_CALLMEBOT_APIKEY.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ label, ok }: { label: string; ok?: boolean }) {
  const yes = Boolean(ok);
  return (
    <div
      className={cls(
        'rounded-xl border px-3 py-2 text-center text-xs font-medium',
        yes ? 'bg-emerald-50 text-emerald-800' : 'bg-muted text-muted-foreground',
      )}
    >
      {label}: {yes ? 'ON' : 'OFF'}
    </div>
  );
}
