# KCE — Growth Pack (Destinations + TEST/LIVE label + Cron debug)

This pack focuses on **speeding up go‑to‑market** while keeping the platform stable.

## What’s new

### 1) Destination landing pages (SEO + conversion)

- New: `/destinations` (top destinations list)
- New: `/destinations/[slug]` (destination detail)
- Spanish aliases:
  - `/destinos` → redirects to `/destinations`
  - `/destinos/[slug]` → redirects to `/destinations/[slug]`

These pages pull cities from tour facets and render **premium tour cards + reviews + lead capture**.

### 2) Header env pill: TEST vs LIVE

The header now shows a small pill near the logo:

- `TEST` for local/preview or when Stripe key is `sk_test_*`
- `LIVE` only when `VERCEL_ENV=production` and Stripe key is live

This helps you avoid “am I on test?” confusion while you iterate.

### 3) GitHub Actions cron workflows: self‑diagnosing failures

The workflows now print:

- HTTP status
- response body

…so you can debug in seconds (wrong URL, wrong token, endpoint 500, etc.).

Docs: `RUNBOOK_CRONS_GITHUB_ACTIONS.md`

### 4) Less noisy “system issue” banner

StatusBanner now requires **2 consecutive failures** before showing the warning.

## Quick verification

1) Run locally:

```bash
npm run dev
```

2) Open:

- `/es/destinations`
- `/es/destinations/bogota` (use a real city slug from your DB)

3) Confirm the header shows `TEST` in local.

4) Check workflows:

- GitHub → Actions → run `KCE Autopilot Cron` manually (workflow_dispatch)
- Read the body dump if it fails.
