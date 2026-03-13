-- supabase_patch_p48_crm_templates_variants.sql
-- Add A/B variants + weights to crm_templates.
-- Safe to run multiple times.

begin;

alter table public.crm_templates
  add column if not exists variant text not null default 'A';

alter table public.crm_templates
  add column if not exists weight integer not null default 1;

-- backfill
update public.crm_templates
  set variant = 'A'
where variant is null or trim(variant) = '';

update public.crm_templates
  set weight = 1
where weight is null or weight < 1;

-- update unique index to allow multiple variants per key/locale/channel
drop index if exists public.crm_templates_unique_key;

create unique index if not exists crm_templates_unique_key_v2
  on public.crm_templates (key, locale, channel, variant);

create index if not exists crm_templates_key_locale_enabled
  on public.crm_templates (key, locale, enabled);

commit;
