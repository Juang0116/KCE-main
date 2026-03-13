-- supabase_patch_p86_security_events_hardening.sql
-- Adds indexes + lightweight retention helpers for security/audit signals.
-- Safe to run multiple times.

begin;

-- SECURITY EVENTS
create index if not exists security_events_created_at_idx
  on public.security_events (created_at desc);

create index if not exists security_events_type_idx
  on public.security_events (type);

create index if not exists security_events_ip_idx
  on public.security_events (ip);

-- EVENTS (general) - helps dashboards + incident correlation
create index if not exists events_type_created_at_idx
  on public.events (type, created_at desc);

create index if not exists events_created_at_idx
  on public.events (created_at desc);

-- Optional: retention helper table (ops can log cleanup runs)
create table if not exists public.ops_retention_runs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('events','security_events','web_vitals','ai_runs')),
  cutoff timestamptz not null,
  deleted_count integer not null default 0,
  status text not null default 'ok' check (status in ('ok','failed')),
  meta jsonb,
  created_at timestamptz not null default now()
);

commit;
