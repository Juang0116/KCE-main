# KCE Runbook — GitHub Actions Crons (Autopilot + Outbound)

This repo ships 2 scheduled workflows:

- **KCE Autopilot Cron** → calls your `/api/admin/sales/autopilot/cron`
- **KCE Outbound Cron** → calls your `/api/admin/outbound/cron`

They are designed to **fail fast with an informative response dump** when your endpoint returns non‑200.

## 1) Required GitHub Secrets

In GitHub → **Repo Settings → Secrets and variables → Actions → New repository secret**:

### Autopilot

- `AUTOPILOT_CRON_URL`
  - Example: `https://knowingcultures.vercel.app/api/admin/sales/autopilot/cron`
- `AUTOPILOT_API_TOKEN`
  - Must match your Vercel env var `AUTOPILOT_API_TOKEN`

### Outbound

- `OUTBOUND_CRON_URL`
  - Example: `https://knowingcultures.vercel.app/api/admin/outbound/cron`
- `AUTOPILOT_API_TOKEN`
  - Same token as above (used as the Bearer auth)

If any secret is missing, the workflow **prints [SKIP]** and exits 0.

## 2) Required Vercel env vars

In Vercel → Project → Settings → Environment Variables:

- `AUTOPILOT_API_TOKEN` (server‑only)

Optionally you may also configure:

- `CRON_SECRET` (if you gate certain cron routes)
- `OPS_CIRCUIT_ENABLED` / thresholds (if you want circuit breaker behavior)

## 3) How to debug failures quickly

When a run fails, open the job logs:

- You will see **HTTP <status>**
- Then a **response body dump** from the endpoint

Typical causes:

- Wrong domain (Preview URL vs Production URL)
- Missing `AUTOPILOT_API_TOKEN` on Vercel or GitHub
- Endpoint returning 401/403 because auth token mismatched
- Endpoint returning 500 due to missing Supabase/Resend/Stripe config

## 4) Manual test (local)

If your local dev server is running on `http://localhost:3000`:

```bash
curl -sS -X POST "http://localhost:3000/api/admin/sales/autopilot/cron" \
  -H "Authorization: Bearer $AUTOPILOT_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"limit":50,"dryRun":true}'
```

You should get a JSON body with `{ ok: true, ... }`.
