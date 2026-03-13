-- supabase_patch_p90_dr_drills.sql
-- Disaster Recovery drills + backup freshness monitoring.
-- Safe to run multiple times.

begin;

create table if not exists public.ops_dr_drills (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('restore_test','webhook_replay','db_backup_restore','runbook_review','tabletop')),
  status text not null default 'completed' check (status in ('planned','in_progress','completed','failed')),
  notes text,
  performed_by text,
  performed_at timestamptz not null default now(),
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ops_dr_drills_performed_at_idx
  on public.ops_dr_drills (performed_at desc);

commit;
