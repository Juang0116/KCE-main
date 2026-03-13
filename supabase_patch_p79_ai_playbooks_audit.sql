-- supabase_patch_p79_ai_playbooks_audit.sql
-- Store AI playbook runs for audit/cost governance.

create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  vid text,
  playbook text,
  model text,
  provider text,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  status text not null default 'ok' check (status in ('ok','blocked','error')),
  cost_minor int,
  currency text default 'USD',
  created_at timestamptz not null default now()
);

create index if not exists ai_runs_created_at_idx on public.ai_runs(created_at desc);
