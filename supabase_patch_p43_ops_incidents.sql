-- supabase_patch_p43_ops_incidents.sql
-- P43: Operational incidents table for checkout/webhook/email failures + admin panel.

create table if not exists public.ops_incidents (
  id uuid primary key default gen_random_uuid(),
  request_id text,
  severity text not null check (severity in ('info','warn','critical')),
  kind text not null,
  actor text,
  path text,
  method text,
  ip text,
  user_agent text,
  message text not null,
  fingerprint text not null unique,
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','acked','resolved')),
  count int not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ops_incidents_status_idx on public.ops_incidents(status);
create index if not exists ops_incidents_kind_idx on public.ops_incidents(kind);
create index if not exists ops_incidents_severity_idx on public.ops_incidents(severity);
create index if not exists ops_incidents_last_seen_idx on public.ops_incidents(last_seen_at desc);
create index if not exists ops_incidents_created_idx on public.ops_incidents(created_at desc);

-- Optional: RLS off (admin-only access via service role endpoints)
alter table public.ops_incidents disable row level security;
