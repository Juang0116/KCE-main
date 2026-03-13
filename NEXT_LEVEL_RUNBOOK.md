# KCE Next Level Runbook (P0/P1)

This repo includes a QA harness and security hardening patterns.

## One-command CI gate

Run locally:

- `npm run qa:ci`

## Full local verification (CI gate + smoke test)

Run locally (requires a build):

- `npm run qa:full`

This will:

- build the app
- start `next start` on port 3100
- hit key public routes + `/api/health`
- fail if any route returns 4xx/5xx (except redirects)

This runs:

- `npm run check` (eslint + typecheck + prettier check)
- `npm run qa:gate` (secrets hygiene + security config sanity)
- `npm run build`

## Admin QA smoke tests

In dev/prod, open:

- `/admin/qa`

Then click **Run** (and optionally **Deep**). It checks:

- Env presence (Supabase/Stripe/Resend, plus LINK_TOKEN_SECRET in prod)
- Supabase connectivity and core tables head-count access
- Stripe API connectivity
- CORS allowlist basics

## Deployment checklist (minimum)

- Set `NEXT_PUBLIC_SITE_URL` to your real https domain
- Set `LINK_TOKEN_SECRET` (32+ random chars)
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is only server-side (never `NEXT_PUBLIC_*`)
- Keep `.env*` files out of git (QA-GATE enforces this)
- Rotate keys if you ever committed any secret

## Rate limiting tables

This build expects:

- `public.event_locks`
- `public.rate_limits`

If missing, create them in Supabase (see existing SQL in repo docs / runbook).
