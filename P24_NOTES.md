# P24 — Guardrails + Alerts (Revenue Ops)
- Added DB-backed alert rules + fired alerts tables.
- Added alerting cron endpoint and wired into sales autopilot cron (best-effort).
- Added tracking dedupe/allowlist hardening to /api/track.
- Added optimizer guardrail: require min paid samples before a variant can win (CRM_OPTIMIZE_MIN_PAID, default=3).
