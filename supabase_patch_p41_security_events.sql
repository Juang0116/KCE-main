-- supabase_patch_p41_security_events.sql
-- P41: security telemetry table for rate-limit, signed-actions failures, origin blocks, etc.

create extension if not exists "pgcrypto";

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  request_id text null,
  severity text not null check (severity in ('info','warn','critical')),
  kind text not null,
  actor text null,
  method text null,
  path text null,
  ip text null,
  user_agent text null,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists security_events_created_at_idx on public.security_events (created_at desc);
create index if not exists security_events_kind_idx on public.security_events (kind);
create index if not exists security_events_actor_idx on public.security_events (actor);

-- Optional: restrict access (recommended). Keep open read for service-role only.
alter table public.security_events enable row level security;

-- If you want to view in admin UI via service role, no policies are needed.
-- If you later want read access for authenticated admins via RLS, add policies explicitly.
