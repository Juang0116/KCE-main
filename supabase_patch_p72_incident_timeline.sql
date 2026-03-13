-- supabase_patch_p72_incident_timeline.sql
-- P72: SRE-lite incident timeline + postmortems for ops_incidents.

create table if not exists public.ops_incident_updates (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.ops_incidents(id) on delete cascade,
  kind text not null default 'note' check (kind in ('note','action','status')),
  actor text,
  message text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ops_incident_updates_incident_idx on public.ops_incident_updates(incident_id, created_at desc);

alter table public.ops_incident_updates disable row level security;

create table if not exists public.ops_postmortems (
  incident_id uuid primary key references public.ops_incidents(id) on delete cascade,
  owner text,
  summary text,
  customer_impact text,
  root_cause text,
  timeline text,
  what_went_well text,
  what_went_wrong text,
  action_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at_ops_postmortems()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_ops_postmortems on public.ops_postmortems;
create trigger set_updated_at_ops_postmortems
before update on public.ops_postmortems
for each row execute function public.set_updated_at_ops_postmortems();

alter table public.ops_postmortems disable row level security;
