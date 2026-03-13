-- supabase_patch_p55_alerting_guardrails.sql
-- P24: alerting + optimizer guardrails (non-breaking)
-- Safe to run multiple times.

begin;

-- Alert rules (configurable)
create table if not exists public.crm_alert_rules (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  scope text not null default 'global', -- future: per-key/locale/channel/cohort
  channel text null,
  locale text null,
  metric text not null, -- 'paid_rate_drop' | 'failed_rate_spike' | 'open_rate_drop'
  window_days int not null default 7,
  threshold_drop numeric null, -- e.g. 0.3 for -30% relative
  threshold_rate numeric null, -- e.g. 0.12 for 12%
  min_sent int not null default 80,
  severity text not null default 'warn', -- 'info' | 'warn' | 'critical'
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_alert_rules_enabled_idx
  on public.crm_alert_rules(enabled, metric);

-- Alerts fired (history)
create table if not exists public.crm_alerts (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid null references public.crm_alert_rules(id) on delete set null,
  key text not null,
  scope text not null default 'global',
  channel text null,
  locale text null,
  metric text not null,
  severity text not null default 'warn',
  title text not null,
  message text not null,
  data jsonb not null default '{}'::jsonb,
  fired_at timestamptz not null default now()
);

create index if not exists crm_alerts_fired_at_idx
  on public.crm_alerts(fired_at desc);

create index if not exists crm_alerts_metric_idx
  on public.crm_alerts(metric, fired_at desc);

-- Trigger to keep updated_at fresh
create or replace function public._touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_crm_alert_rules_touch on public.crm_alert_rules;
create trigger trg_crm_alert_rules_touch
before update on public.crm_alert_rules
for each row execute function public._touch_updated_at();

-- Seed some default rules (idempotent by key+metric+channel+locale)
insert into public.crm_alert_rules(key, metric, window_days, threshold_drop, min_sent, severity)
select 'global_paid_rate_drop', 'paid_rate_drop', 7, 0.30, 120, 'warn'
where not exists (
  select 1 from public.crm_alert_rules
  where key='global_paid_rate_drop' and metric='paid_rate_drop'
);

insert into public.crm_alert_rules(key, metric, window_days, threshold_rate, min_sent, severity)
select 'global_failed_rate_spike', 'failed_rate_spike', 3, 0.12, 80, 'critical'
where not exists (
  select 1 from public.crm_alert_rules
  where key='global_failed_rate_spike' and metric='failed_rate_spike'
);

commit;
