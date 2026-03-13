-- supabase_patch_event_locks_scope.sql
-- Fix/upgrade for public.event_locks when an older schema exists without `scope`.
-- Safe to run multiple times.

-- 1) Ensure table exists (new installs)
create table if not exists public.event_locks (
  id bigserial primary key,
  key text not null,
  scope text not null default 'global',
  owner text null,
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null,
  meta jsonb not null default '{}'::jsonb
);

-- 2) If the table exists but is missing `scope`, add it before creating the (scope,key) unique index
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'event_locks'
  ) then
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public' and table_name = 'event_locks' and column_name = 'scope'
    ) then
      alter table public.event_locks
        add column scope text not null default 'global';
    end if;
  end if;
end $$;

-- 3) Helpful indexes (idempotent)
-- If `scope` exists, enforce uniqueness on (scope, key). Otherwise, fall back to (key).
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'event_locks' and column_name = 'scope'
  ) then
    execute 'create unique index if not exists event_locks_scope_key_uidx on public.event_locks (scope, key)';
  else
    execute 'create unique index if not exists event_locks_key_uidx on public.event_locks (key)';
  end if;
end $$;

create index if not exists event_locks_expires_at_idx
  on public.event_locks (expires_at);
