-- supabase_patch_p50_template_optimization.sql
-- Winner locks (cohort/hysteresis) + auto-weight promotion for CRM templates.
-- Safe to run multiple times.

begin;

-- Ensure variants/weights exist (for older schemas).
alter table public.crm_templates
  add column if not exists variant text not null default 'A';

alter table public.crm_templates
  add column if not exists weight integer not null default 1;

-- Track whether a weight was auto-adjusted (so humans can keep manual control).
alter table public.crm_templates
  add column if not exists weight_source text not null default 'manual';

alter table public.crm_templates
  add column if not exists weight_updated_at timestamptz;

-- Backfill sane values.
update public.crm_templates set variant = 'A'
  where variant is null or trim(variant) = '';

update public.crm_templates set weight = 1
  where weight is null or weight < 1;

update public.crm_templates set weight_source = 'manual'
  where weight_source is null or trim(weight_source) = '';

-- Unique index should include variant.
drop index if exists public.crm_templates_unique_key;
drop index if exists public.crm_templates_unique_key_v2;

create unique index if not exists crm_templates_unique_key_v3
  on public.crm_templates (key, locale, channel, variant);

create index if not exists crm_templates_key_locale_enabled
  on public.crm_templates (key, locale, enabled);

-- Winner locks per cohort (e.g. ISO week) to avoid thrashing.
create table if not exists public.crm_template_winner_locks (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  locale text not null,
  channel text not null,
  cohort text not null,
  winner_variant text not null,
  sample_sent integer not null default 0,
  paid_rate numeric not null default 0,
  computed_at timestamptz not null default now(),
  lock_until timestamptz not null,
  meta jsonb not null default '{}'::jsonb
);

create unique index if not exists crm_template_winner_locks_unique
  on public.crm_template_winner_locks (key, locale, channel, cohort);

create index if not exists crm_template_winner_locks_active
  on public.crm_template_winner_locks (key, locale, channel, lock_until desc);

commit;
