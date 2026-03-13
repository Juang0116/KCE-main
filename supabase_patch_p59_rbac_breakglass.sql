-- supabase_patch_p59_rbac_breakglass.sql
-- P28: RBAC + break-glass tokens for privileged ops
-- Safe to run multiple times.

create table if not exists public.crm_roles (
  key text primary key,
  name text not null,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_role_bindings (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  role_key text not null references public.crm_roles(key) on delete cascade,
  created_at timestamptz not null default now(),
  unique(actor, role_key)
);

create table if not exists public.crm_breakglass_tokens (
  token_hash text primary key,
  actor text not null,
  reason text,
  created_by text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

-- Lock down tables (service-role bypasses RLS)
alter table public.crm_roles enable row level security;
alter table public.crm_role_bindings enable row level security;
alter table public.crm_breakglass_tokens enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='crm_roles') then
    create policy "deny_all" on public.crm_roles for all using (false);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='crm_role_bindings') then
    create policy "deny_all" on public.crm_role_bindings for all using (false);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='crm_breakglass_tokens') then
    create policy "deny_all" on public.crm_breakglass_tokens for all using (false);
  end if;
end $$;

-- Seed roles (idempotent)
insert into public.crm_roles (key, name, permissions)
values
  ('owner','Owner','["*"]'::jsonb),
  ('ops','Ops','["metrics_view","alerts_ack","ops_control","approvals_execute"]'::jsonb),
  ('revenue_ops','Revenue Ops','["metrics_view","revenue_view","templates_edit"]'::jsonb),
  ('support','Support','["metrics_view","tickets_reply","customers_view"]'::jsonb),
  ('viewer','Viewer','["metrics_view","revenue_view"]'::jsonb)
on conflict (key) do update
set name = excluded.name,
    permissions = excluded.permissions;

create index if not exists crm_role_bindings_actor_idx on public.crm_role_bindings(actor);
create index if not exists crm_breakglass_expires_idx on public.crm_breakglass_tokens(expires_at);

-- NOTE:
-- Bind an actor (basic-auth username) to roles, e.g.:
-- insert into public.crm_role_bindings (actor, role_key) values ('admin','owner');
