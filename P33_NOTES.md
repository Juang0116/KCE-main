# P33 Notes

## What's new
- Optional internal HMAC signing for internal/cron endpoints (`INTERNAL_HMAC_SECRET`, `INTERNAL_HMAC_REQUIRED=1`).
- Payload size guards for high-cost endpoints (AI/checkout).
- Channel-aware rate-limits by using `x-kce-channel` header (values: web|admin|email|whatsapp).

## How to sign internal requests (example)
Set `INTERNAL_HMAC_SECRET` in Vercel.
Compute headers:
- `x-kce-ts`: unix seconds
- `x-kce-sig`: base64url(hmac_sha256(secret, `${ts}.${METHOD}.${PATH_WITH_QUERY}.${sha256(body)}`))

If `INTERNAL_HMAC_REQUIRED=1`, missing/invalid signatures return 401.

## Recommended defaults
- Keep `INTERNAL_HMAC_REQUIRED` off until you update your cron caller.
- Send `x-kce-channel: admin` from Admin UI calls if you want higher rate limit buckets.
