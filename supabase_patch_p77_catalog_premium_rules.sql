-- supabase_patch_p77_catalog_premium_rules.sql
-- Availability + pricing rules + curated collections.

create table if not exists public.tour_availability (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  date date not null,
  capacity int,
  remaining int,
  status text not null default 'open' check (status in ('open','closed','sold_out')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tour_id, date)
);

create index if not exists tour_availability_tour_date_idx
  on public.tour_availability(tour_id, date);

create table if not exists public.tour_pricing_rules (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid references public.tours(id) on delete cascade,
  scope text not null default 'tour' check (scope in ('tour','tag','city','global')),
  tag text,
  city text,
  start_date date,
  end_date date,
  min_persons int,
  max_persons int,
  currency text not null default 'EUR' check (char_length(currency)=3),
  delta_minor int not null default 0, -- +/- adjustment
  kind text not null default 'delta' check (kind in ('delta','override')),
  override_price_minor int,
  priority int not null default 100,
  status text not null default 'active' check (status in ('active','paused','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tour_pricing_rules_lookup_idx
  on public.tour_pricing_rules(status, priority);

create table if not exists public.catalog_collections (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  description text,
  locale text default 'es',
  city text,
  tag text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.catalog_collections(id) on delete cascade,
  tour_id uuid not null references public.tours(id) on delete cascade,
  position int not null default 0,
  unique(collection_id, tour_id)
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_tour_availability_updated_at') then
    create trigger trg_tour_availability_updated_at before update on public.tour_availability
    for each row execute function public.kce_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_pricing_rules_updated_at') then
    create trigger trg_pricing_rules_updated_at before update on public.tour_pricing_rules
    for each row execute function public.kce_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_collections_updated_at') then
    create trigger trg_collections_updated_at before update on public.catalog_collections
    for each row execute function public.kce_set_updated_at();
  end if;
end $$;
