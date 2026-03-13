-- P82 — Go-to-market (Launches / Partnerships)

create table if not exists public.growth_launches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  market text,
  start_date date,
  end_date date,
  status text not null default 'draft' check (status in ('draft','live','paused','done')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_launch_items (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.growth_launches(id) on delete cascade,
  title text not null,
  owner text,
  status text not null default 'todo' check (status in ('todo','doing','done','blocked')),
  due_at timestamptz,
  checklist_key text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists growth_launch_items_launch_idx on public.growth_launch_items (launch_id, status, due_at);

alter table public.growth_launches enable row level security;
alter table public.growth_launch_items enable row level security;

-- No anon access (admin/service role only).
drop policy if exists "growth_launches_no_anon" on public.growth_launches;
create policy "growth_launches_no_anon" on public.growth_launches for all to anon using (false) with check (false);

drop policy if exists "growth_launch_items_no_anon" on public.growth_launch_items;
create policy "growth_launch_items_no_anon" on public.growth_launch_items for all to anon using (false) with check (false);
