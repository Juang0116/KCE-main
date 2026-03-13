# P32 — Security hardening (Turnstile + admin login RL)

## What changed
- Optional Cloudflare Turnstile verification (server-side) for:
  - /api/checkout
  - /api/bot/create-checkout
  - /api/ai
- Admin login hardening:
  - Rate limit by IP (10 attempts / 15 minutes)
  - Constant-time credential compare (timingSafeEqual)

## Env vars (optional)
### Turnstile
- TURNSTILE_SECRET_KEY=...
- TURNSTILE_ENFORCE=true   # or 1 (enforces token presence; if not set, Turnstile is best-effort)
- NEXT_PUBLIC_TURNSTILE_SITE_KEY=...  # only needed if you render the widget in UI

## Notes
- If TURNSTILE_SECRET_KEY is empty/unset, verification is disabled.
- If TURNSTILE_ENFORCE is not enabled, missing `turnstileToken` does not block requests.
