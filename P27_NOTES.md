# P27 — Ops Audit + Dual-control approvals + Digest

## Env vars
- OPS_TWO_MAN_RULE=true|false (default false)
- OPS_APPROVAL_TTL_MINUTES=15
- OPS_APPROVER_TOKEN=... (optional; if set, approvals require header `x-ops-approver-token`)
- OPS_DIGEST_EMAIL_TO=ops@... (optional; enables digest cron email)
- RESEND_API_KEY, RESEND_FROM (for digest emails)
- CRON_SECRET (protects /api/admin/metrics/digest/cron)

## Supabase
Run: `supabase_patch_p58_audit_ops.sql`

## Ops UI
- /admin/ops shows pending approvals and allows Approve & Execute when Two-man rule is enabled.
