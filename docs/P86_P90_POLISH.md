# P86–P90 (Polish / Resilience / Security Final)

This bundle finalizes the "enterprise 10/10" loop with:
- P86: Harden public POST endpoints + security event indexing/retention runs.
- P87: Security disclosure endpoints (security.txt) + header polish.
- P88: Dependency audit gate in CI (npm audit with thresholds).
- P89: Performance budgets -> Ops incidents + weekly reporting.
- P90: DR drills + backup freshness checks -> incidents + admin UI.

## Apply order
1) Run SQL:
- supabase_patch_p86_security_events_hardening.sql
- supabase_patch_p90_dr_drills.sql

2) Configure env (see .env.example additions):
- PERF_BUDGET_* thresholds
- OPS_BACKUP_MAX_AGE_HOURS
- OPS_DR_DRILL_MAX_AGE_DAYS
- OPS_INCIDENT_AUTO_ESCALATE already supported

3) Verify:
- /admin/system/security
- /admin/system/dr
- /admin/analytics/performance (budgets highlighted)
- POST /api/admin/ops/alerts/run (should include perfBudget + backup/dr checks)
