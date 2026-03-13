-- supabase_patch_p56_auto_mitigation.sql
-- KCE (P25) — Auto-mitigation + runtime flags + channel pauses
-- Safe/idempotent.

begin;

-- 1) Runtime flags (DB-configurable switches; env still works as default)
create table if not exists public.crm_runtime_flags (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- 2) Channel pauses (used to temporarily stop outbound on a channel)
create table if not exists public.crm_channel_pauses (
  channel      text primary key check (channel in ('email','whatsapp','web','chat')),
  paused_until timestamptz not null,
  reason       text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists crm_channel_pauses_paused_until_idx
  on public.crm_channel_pauses (paused_until);

-- 3) Alert rules + alerts (if not already present)
create table if not exists public.crm_alert_rules (
  id           uuid primary key default gen_random_uuid(),
  type         text not null, -- e.g. 'failed_rate_spike', 'paid_rate_drop'
  is_enabled   boolean not null default true,
  params       jsonb not null default '{}'::jsonb,
  severity     text not null default 'warn' check (severity in ('info','warn','critical')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists crm_alert_rules_type_idx
  on public.crm_alert_rules (type);

create table if not exists public.crm_alerts (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,
  severity     text not null default 'warn' check (severity in ('info','warn','critical')),
  message      text not null,
  meta         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists crm_alerts_created_at_idx
  on public.crm_alerts (created_at desc);

create index if not exists crm_alerts_type_idx
  on public.crm_alerts (type);

-- 4) Mitigation actions ledger (what we did, when, and why)
create table if not exists public.crm_mitigation_actions (
  id           uuid primary key default gen_random_uuid(),
  alert_id     uuid references public.crm_alerts(id) on delete set null,
  alert_type   text not null,
  action       text not null, -- e.g. 'pause_channel', 'disable_auto_promote', 'create_ticket'
  status       text not null default 'applied' check (status in ('applied','skipped','failed')),
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists crm_mitigation_actions_created_at_idx
  on public.crm_mitigation_actions (created_at desc);

-- Seed (idempotent): basic rules
insert into public.crm_alert_rules (type, severity, params)
select 'failed_rate_spike', 'critical', jsonb_build_object(
  'window_minutes', 60,
  'min_messages', 20,
  'failed_rate_threshold', 0.25
)
where not exists (select 1 from public.crm_alert_rules where type='failed_rate_spike');

insert into public.crm_alert_rules (type, severity, params)
select 'paid_rate_drop', 'warn', jsonb_build_object(
  'window_hours', 24,
  'baseline_days', 7,
  'min_sent', 50,
  'relative_drop_threshold', 0.30
)
where not exists (select 1 from public.crm_alert_rules where type='paid_rate_drop');

commit;
