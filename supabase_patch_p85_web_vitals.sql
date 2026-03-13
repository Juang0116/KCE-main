-- P85 — Performance monitoring (Web Vitals / Navigation Timing)

create table if not exists public.web_vitals (
  id uuid primary key default gen_random_uuid(),
  vid text,
  metric text not null,
  value double precision,
  rating text,
  page text,
  user_agent text,
  referrer text,
  props jsonb,
  created_at timestamptz not null default now()
);

create index if not exists web_vitals_metric_created_idx on public.web_vitals(metric, created_at desc);

alter table public.web_vitals enable row level security;

-- allow anon insert (guarded in API by origin + rate limit)
drop policy if exists "web_vitals_anon_insert" on public.web_vitals;
create policy "web_vitals_anon_insert" on public.web_vitals for insert to anon with check (true);

drop policy if exists "web_vitals_no_select" on public.web_vitals;
create policy "web_vitals_no_select" on public.web_vitals for select to anon using (false);
