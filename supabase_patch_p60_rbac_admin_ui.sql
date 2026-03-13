-- P60: RBAC admin UI support + strict enforcement helpers
-- Date: 2026-02-15
-- Safe to run multiple times.

create table if not exists public.crm_permissions_catalog (
  key text primary key,
  description text not null,
  created_at timestamptz not null default now()
);

insert into public.crm_permissions_catalog (key, description) values
  ('metrics_view', 'View admin metrics dashboards and APIs'),
  ('alerts_ack', 'Acknowledge alerts'),
  ('ops_control', 'Run operational controls (pause channel, flags)'),
  ('approvals_execute', 'Approve/execute ops approvals'),
  ('rbac_admin', 'Manage roles, bindings, and break-glass issuance'),
  ('templates_edit', 'Edit CRM templates and run optimizations')
on conflict (key) do nothing;

-- Optional helper view for UI
create or replace view public.crm_roles_expanded as
select
  r.role_key,
  r.name,
  r.permissions,
  r.created_at,
  coalesce(jsonb_array_length(r.permissions), 0) as permission_count
from public.crm_roles r;

-- Breakglass requests log (UI + approvals)
create table if not exists public.crm_breakglass_requests (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  reason text,
  ttl_minutes int not null default 30,
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text,
  approval_id uuid,
  token_id uuid
);

create index if not exists crm_breakglass_requests_status_idx on public.crm_breakglass_requests(status, requested_at desc);
