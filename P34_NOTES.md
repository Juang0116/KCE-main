# P34 — Hardening v3 (HMAC helpers + strict allowlists + cost budgets)

## What changed
- Added **daily cost budgets per visitor (vid)** for:
  - `/api/ai` (default 30/day)
  - `/api/checkout` (default 10/day)
  - `/api/bot/create-checkout` (default 10/day)
- Added **strict allowlists**:
  - slug must match `^[a-z0-9-]{1,160}$`
  - date must be ISO `YYYY-MM-DD`
  - locale must match `xx` or `xx-YY`
  - whatsapp phone must match `+?[0-9]{6,18}`
- Fixed missing `channel` variable in multiple endpoints (was required for channel-aware RL keys).
- Added `internalFetch()` helper with automatic INTERNAL_HMAC signing to support internal route-to-route calls.

## Env vars
- `COST_BUDGET_AI_PER_DAY` (default 30)
- `COST_BUDGET_CHECKOUT_PER_DAY` (default 10)
- `COST_BUDGET_BOT_CHECKOUT_PER_DAY` (default 10)

Internal HMAC (already supported):
- `INTERNAL_HMAC_SECRET=...`
- `INTERNAL_HMAC_REQUIRED=1` (optional strict)

## Rollout suggestion
1. Deploy with budgets default (fail-open if Supabase is unavailable).
2. Monitor `/admin/metrics` alerts + paid funnels.
3. If you want stricter enforcement, set `INTERNAL_HMAC_REQUIRED=1` only after any internal callers sign requests using `internalFetch`.
