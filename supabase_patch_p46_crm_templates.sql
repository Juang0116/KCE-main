-- supabase_patch_p46_crm_templates.sql
-- CRM templates (WhatsApp/Email) editable desde BD.
-- Safe to run multiple times.

begin;

create table if not exists public.crm_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  locale text not null default 'es',
  channel text not null default 'whatsapp',
  subject text null,
  body text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- avoid duplicates
create unique index if not exists crm_templates_unique_key
  on public.crm_templates (key, locale, channel);

-- useful filters
create index if not exists crm_templates_key_enabled
  on public.crm_templates (key, enabled);

-- auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_crm_templates_updated_at on public.crm_templates;
create trigger trg_crm_templates_updated_at
before update on public.crm_templates
for each row execute function public.set_updated_at();

-- RLS: locked by default (admin API uses service role)
alter table public.crm_templates enable row level security;

-- optional: allow read for authenticated (harmless), keep write restricted
-- you can remove this if you want it fully locked.
drop policy if exists crm_templates_read_auth on public.crm_templates;
create policy crm_templates_read_auth
  on public.crm_templates
  for select
  to authenticated
  using (enabled = true);

commit;
