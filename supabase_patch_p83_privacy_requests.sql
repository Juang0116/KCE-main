-- P83 — Compliance (Privacy requests: export/delete)

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('export','delete')),
  email text not null,
  name text,
  message text,
  locale text,
  status text not null default 'open' check (status in ('open','in_progress','done','rejected')),
  processed_at timestamptz,
  processed_by text,
  result_notes text,
  created_at timestamptz not null default now()
);

create index if not exists privacy_requests_status_created_idx on public.privacy_requests(status, created_at desc);

alter table public.privacy_requests enable row level security;

-- allow anonymous insert (guarded in API by origin + rate limit + optional Turnstile)
drop policy if exists "privacy_requests_anon_insert" on public.privacy_requests;
create policy "privacy_requests_anon_insert" on public.privacy_requests
for insert to anon
with check (true);

-- deny anon selects
drop policy if exists "privacy_requests_no_select" on public.privacy_requests;
create policy "privacy_requests_no_select" on public.privacy_requests
for select to anon
using (false);
