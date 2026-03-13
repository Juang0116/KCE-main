-- supabase_patch_p58_audit_ops.sql
-- P27: Ops audit log + optional dual-control approvals

begin;

-- 1) Audit log (append-only)
create table if not exists public.crm_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor text,
  action text not null,
  request_id text,
  ip text,
  user_agent text,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists crm_audit_log_created_at_idx on public.crm_audit_log (created_at desc);
create index if not exists crm_audit_log_action_idx on public.crm_audit_log (action);
create index if not exists crm_audit_log_entity_idx on public.crm_audit_log (entity_type, entity_id);

-- 2) Dual-control approvals (optional feature)
create table if not exists public.crm_ops_approvals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  expires_at timestamptz not null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  request_id text,
  requested_by text,
  approved_by text,
  approved_at timestamptz
);

create index if not exists crm_ops_approvals_status_idx on public.crm_ops_approvals (status);
create index if not exists crm_ops_approvals_expires_at_idx on public.crm_ops_approvals (expires_at);

commit;
