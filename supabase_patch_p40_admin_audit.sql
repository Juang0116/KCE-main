-- supabase_patch_p40_admin_audit.sql
-- P40: Admin audit events (server-only, best-effort)

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  request_id text,
  actor text not null,
  action text not null,
  method text not null,
  path text not null,
  capability text,
  ip text,
  user_agent text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_events_created_at_idx on public.admin_audit_events (created_at desc);
create index if not exists admin_audit_events_actor_idx on public.admin_audit_events (actor);
create index if not exists admin_audit_events_action_idx on public.admin_audit_events (action);

-- Optional: lock down in production. Keep permissive by default for admin service role.
-- alter table public.admin_audit_events enable row level security;
-- create policy "admin audit read" on public.admin_audit_events
--   for select using (false);
