-- P84 — DR / Backups log

create table if not exists public.ops_backups_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'db' check (kind in ('db','storage','config')),
  provider text,
  location text,
  ok boolean not null default true,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists ops_backups_log_created_idx on public.ops_backups_log(created_at desc);

alter table public.ops_backups_log enable row level security;

drop policy if exists "ops_backups_no_anon" on public.ops_backups_log;
create policy "ops_backups_no_anon" on public.ops_backups_log for all to anon using (false) with check (false);
