# P6 — Ops Notifications Setup (Slack/Discord • Email • WhatsApp)

This guide wires KCE Ops alerts to one or more channels so **incidents & security events don't go unnoticed**.

## 1) Webhook (Slack or Discord)

KCE can send a JSON payload to any incoming webhook. Use one of these:

### Slack
1. Create an *Incoming Webhook* in Slack (Workspace → Apps → Incoming Webhooks).
2. Choose (or create) a channel, e.g. `#kce-ops`.
3. Copy the webhook URL and set:

```env
OPS_ALERT_WEBHOOK_URL=https://hooks.slack.com/.../...
```

> You can also use `OPS_SLACK_WEBHOOK_URL`; KCE will prefer it but will fallback to `OPS_ALERT_WEBHOOK_URL`.

### Discord
1. Server Settings → Integrations → Webhooks → **New Webhook**.
2. Choose a channel (recommended: `#kce-ops`).
3. Copy the webhook URL and set `OPS_ALERT_WEBHOOK_URL`.

## 2) Email fallback (Resend)

If webhooks fail or you want a second channel, set:

```env
OPS_ALERT_EMAIL_TO=juan@tu-dominio.com
```

KCE will send via your existing Resend config (`RESEND_API_KEY`, `EMAIL_FROM`).

> You can also use `OPS_NOTIFY_EMAIL_TO`; KCE will fallback between both.

## 3) WhatsApp (CallMeBot) — optional

CallMeBot provides a simple WhatsApp push via a phone + API key.

1. Visit CallMeBot WhatsApp API instructions and follow their pairing steps.
2. Get your `apikey`.
3. Set:

```env
OPS_CALLMEBOT_PHONE=+57XXXXXXXXXX
OPS_CALLMEBOT_APIKEY=XXXXXXXX
```

## 4) Test from Admin

Open:

**/admin/ops/notifications**

and click **Send test notification**.

The page will show which channels are configured (ON/OFF) and whether delivery succeeded.

## 5) Which channel name should you use?

Recommended:
- **Security:** `#kce-security` (or shared `#kce-ops` at the beginning)
- **Ops / incidents:** `#kce-ops`

You can start with a single channel and split later.
