-- P57 — Ops controls: alert acknowledgement + cooldown support
-- Safe to re-run.

-- 1) Allow acknowledging alerts to avoid repeated mitigations / spam.
alter table if exists public.crm_alerts
  add column if not exists acknowledged_at timestamptz;

alter table if exists public.crm_alerts
  add column if not exists acknowledged_by text;

create index if not exists crm_alerts_unacked_by_type_created_idx
  on public.crm_alerts (type, created_at desc)
  where acknowledged_at is null;

-- Note: No destructive changes.
