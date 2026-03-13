-- ============================================================
-- KCE 3.0 — Esquema Supabase (PostgreSQL) — FINAL ✅
-- Idempotente: lo puedes ejecutar las veces que quieras
-- Corrige Security Advisor: search_path, extensiones, RLS, triggers
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0) Extensiones en schema "extensions" (si es posible)
-- ─────────────────────────────────────────────────────────────
create schema if not exists extensions;

do $$
begin
  -- pgcrypto
  if not exists (select 1 from pg_extension where extname='pgcrypto') then
    execute 'create extension pgcrypto with schema extensions';
  else
    if (select n.nspname from pg_extension e join pg_namespace n on n.oid=e.extnamespace
        where e.extname='pgcrypto') <> 'extensions' then
      begin
        execute 'alter extension pgcrypto set schema extensions';
      exception when feature_not_supported then
        raise notice 'pgcrypto no es relocatable; se deja en su schema actual.';
      end;
    end if;
  end if;

  -- pg_trgm
  if not exists (select 1 from pg_extension where extname='pg_trgm') then
    execute 'create extension pg_trgm with schema extensions';
  else
    if (select n.nspname from pg_extension e join pg_namespace n on n.oid=e.extnamespace
        where e.extname='pg_trgm') <> 'extensions' then
      begin
        execute 'alter extension pg_trgm set schema extensions';
      exception when feature_not_supported then
        raise notice 'pg_trgm no es relocatable; se deja en su schema actual.';
      end;
    end if;
  end if;

  -- btree_gin
  if not exists (select 1 from pg_extension where extname='btree_gin') then
    execute 'create extension btree_gin with schema extensions';
  else
    if (select n.nspname from pg_extension e join pg_namespace n on n.oid=e.extnamespace
        where e.extname='btree_gin') <> 'extensions' then
      begin
        execute 'alter extension btree_gin set schema extensions';
      exception when feature_not_supported then
        raise notice 'btree_gin no es relocatable; se deja en su schema actual.';
      end;
    end if;
  end if;
end$$;

-- ─────────────────────────────────────────────────────────────
-- 1) Función utilitaria con search_path fijo (linter feliz)
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Limpieza: funciones/triggers viejos de tsvector (si quedaron)
do $$
begin
  -- Primero elimina triggers que dependan de funciones
  if to_regclass('public.tours') is not null then
    execute 'drop trigger if exists trg_tours_refresh_tsv on public.tours';
    execute 'drop trigger if exists trg_tours_search_tsv on public.tours';
  end if;

  -- Luego ya puedes dropear funciones sin romper dependencias
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'tours_refresh_tsv' and n.nspname = 'public'
  ) then
    execute 'drop function public.tours_refresh_tsv()';
  end if;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'tours_search_tsv_update' and n.nspname = 'public'
  ) then
    execute 'drop function public.tours_search_tsv_update()';
  end if;
end$$;


-- ─────────────────────────────────────────────────────────────
-- 2) Tablas y policies (estado final)
-- ─────────────────────────────────────────────────────────────

-- 2.1 customers_profile (PII opcional)
create table if not exists public.customers_profile (
  user_id     uuid primary key,
  full_name   text,
  phone       text,
  locale      text default 'es-CO',
  preferences jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
drop trigger if exists trg_customers_profile_updated on public.customers_profile;
create trigger trg_customers_profile_updated
before update on public.customers_profile
for each row execute function public.set_updated_at();
alter table public.customers_profile enable row level security;

-- 2.2 tours (catálogo público) — columna generada para búsqueda (sin triggers)
create table if not exists public.tours (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null,
  title           text not null,
  city            text not null,
  tags            text[] not null default '{}'::text[],
  base_price      integer not null check (base_price >= 0), -- minor units (EUR cents)
  duration_hours  int not null default 0 check (duration_hours >= 0),
  images          jsonb not null default '[]'::jsonb,
  summary         text not null default '',
  body_md         text,
  rating          numeric not null default 0 check (rating >= 0 and rating <= 5),
  is_featured     boolean not null default false,
  search_tsv      tsvector not null default ''::tsvector,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 2.2.1 tours search vector trigger (evita generated column immutable error)
create or replace function public.tours_search_tsv_update()
returns trigger
language plpgsql
as $$
begin
  new.search_tsv :=
    setweight(to_tsvector('spanish', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(new.city, '')), 'C') ||
    setweight(to_tsvector('spanish', array_to_string(coalesce(new.tags, '{}'::text[]), ' ')), 'D');

  return new;
end$$;

drop trigger if exists trg_tours_search_tsv on public.tours;
create trigger trg_tours_search_tsv
before insert or update of title, summary, city, tags
on public.tours
for each row
execute function public.tours_search_tsv_update();



-- slug único case-insensitive
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname='public' and tablename='tours' and indexname='uq_tours_slug_nocase'
  ) then
    execute 'create unique index uq_tours_slug_nocase on public.tours (lower(slug))';
  end if;
end$$;

create index if not exists idx_tours_city       on public.tours(city);
create index if not exists idx_tours_tags_gin   on public.tours using gin (tags);
create index if not exists idx_tours_search_tsv on public.tours using gin (search_tsv);

drop trigger if exists trg_tours_updated on public.tours;
create trigger trg_tours_updated
before update on public.tours
for each row execute function public.set_updated_at();

alter table public.tours enable row level security;


-- ─────────────────────────────────────────────────────────────────────────────
-- Tours metrics (P1.4)
-- - view_count: permite ordenar por “popularidad” real sin depender de rating
-- - NOTA: este contador es best-effort. Para antifraude/analítica avanzada,
--         se recomienda migrar a events + agregación / rate-limit por IP.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tours' AND column_name='view_count'
  ) THEN
    ALTER TABLE public.tours ADD COLUMN view_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tours_view_count ON public.tours (view_count DESC);

-- Atomic increment helper (used from server-only route with service-role)
CREATE OR REPLACE FUNCTION public.increment_tour_view(p_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tours
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE slug = p_slug;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_tour_view(text) FROM PUBLIC;
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tours' and policyname='tours_public_select'
  ) then
    create policy tours_public_select on public.tours
      for select to anon, authenticated using (true);
  end if;
end$$;
grant usage on schema public to anon, authenticated;
grant select on table public.tours to anon, authenticated;

-- 2.3 tour_availability (consulta pública)
create table if not exists public.tour_availability (
  id        uuid primary key default gen_random_uuid(),
  tour_id   uuid references public.tours(id) on delete cascade,
  date      date not null,
  capacity  int not null check (capacity >= 0),
  price     integer,              -- si es NULL, usar base_price
  unique (tour_id, date)
);
create index if not exists idx_avail_tour_date on public.tour_availability(tour_id, date);

alter table public.tour_availability enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tour_availability' and policyname='availability_public_select'
  ) then
    create policy availability_public_select on public.tour_availability
      for select to anon, authenticated using (true);
  end if;
end$$;
grant select on table public.tour_availability to anon, authenticated;

-- 2.4 bookings (cerrado; sólo service_role)
create table if not exists public.bookings (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid,
  tour_id            uuid references public.tours(id) on delete set null,
  date               date not null,
  persons            int  not null check (persons > 0),
  extras             jsonb,
  status             text check (status in ('pending','paid','canceled')) default 'pending',

  -- monetary fields are stored in minor units for the given currency
  total              integer, -- minor units
  currency           text default 'EUR' check (char_length(currency)=3),

  -- optional: capture the "catalog price" (also in minor units) and its source currency
  origin_currency    text default 'EUR' check (char_length(origin_currency)=3),
  tour_price_minor   integer,

  payment_provider   text,
  stripe_session_id  text unique,
  customer_email     text,
  customer_name      text,
  phone              text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create index if not exists idx_bookings_tour_date on public.bookings(tour_id, date);
create index if not exists idx_bookings_status    on public.bookings(status);
drop trigger if exists trg_bookings_updated on public.bookings;
create trigger trg_bookings_updated
before update on public.bookings
for each row execute function public.set_updated_at();

alter table public.bookings enable row level security;

-- (silenciar "RLS enabled, no policy") → deny-all explícito
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bookings') then
    create policy bookings_deny_all on public.bookings
      for all to anon, authenticated using (false) with check (false);
  end if;
end$$;

-- FIX: tours.slug debe ser UNIQUE para poder referenciarlo desde reviews.tour_slug
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tours_slug_unique'
      and conrelid = 'public.tours'::regclass
  ) then
    alter table public.tours
      add constraint tours_slug_unique unique (slug);
  end if;
end $$;

-- 2.5 reviews (públicas con moderación + honeypot)
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  tour_id    uuid references public.tours(id) on delete cascade,
  tour_slug  text references public.tours(slug) on delete cascade,
  user_id    uuid,
  rating     int  check (rating between 1 and 5),
  comment    text,
  approved   boolean default false,
  honeypot   text,
  ip         inet,
  created_at timestamptz default now()
);

-- Reviews v2 (presentación + moderación)
alter table public.reviews add column if not exists title text;
alter table public.reviews add column if not exists body text;
alter table public.reviews add column if not exists customer_name text;
alter table public.reviews add column if not exists customer_email text;
alter table public.reviews add column if not exists avatar_url text;
alter table public.reviews add column if not exists media_urls jsonb not null default '[]'::jsonb;
alter table public.reviews add column if not exists face_consent boolean not null default false;
alter table public.reviews add column if not exists status text default 'pending';
alter table public.reviews add column if not exists published_at timestamptz;
alter table public.reviews add column if not exists verified_booking_id uuid references public.bookings(id) on delete set null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='reviews_status_check') then
    alter table public.reviews
      add constraint reviews_status_check check (status in ('pending','approved','rejected'));
  end if;
end$$;

create index if not exists idx_reviews_status       on public.reviews(status);
create index if not exists idx_reviews_published_at on public.reviews(published_at);

do $$
begin
  if not exists (select 1 from pg_constraint where conname='reviews_tour_ref_check') then
    alter table public.reviews
      add constraint reviews_tour_ref_check
      check (tour_id is not null or tour_slug is not null);
  end if;
end$$;

create index if not exists idx_reviews_tour_id   on public.reviews(tour_id);
create index if not exists idx_reviews_tour_slug on public.reviews(tour_slug);
create index if not exists idx_reviews_approved  on public.reviews(approved);

alter table public.reviews enable row level security;

-- Limpia nombres heredados si existieran
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='reviews_public_select') then
    execute 'drop policy reviews_public_select on public.reviews';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='reviews_public_insert') then
    execute 'drop policy reviews_public_insert on public.reviews';
  end if;
end$$;

-- Políticas finales
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='reviews_select_approved') then
    create policy reviews_select_approved
      on public.reviews for select to anon, authenticated
      using (coalesce(status,'pending') = 'approved' or approved = true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='reviews_public_insert') then
    create policy reviews_public_insert
      on public.reviews for insert to anon, authenticated
      with check (
        coalesce(honeypot,'') = ''
        and coalesce(status,'pending') = 'pending'
        and coalesce(approved,false) = false
        and rating between 1 and 5
      );
  end if;
end$$;

grant usage on schema public to anon, authenticated;
grant select on table public.tours, public.tour_availability to anon, authenticated;
grant select, insert on table public.reviews to anon, authenticated;

-- Storage bucket para avatars (recomendado). Upload se hace por API con service_role.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name='storage') then
    insert into storage.buckets (id, name, public)
      values ('review_avatars', 'review_avatars', true)
    on conflict (id) do nothing;
  end if;
end$$;

-- Storage bucket para fotos de reseñas (galería). Upload se hace por API con service_role.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name='storage') then
    insert into storage.buckets (id, name, public)
      values ('review_media', 'review_media', true)
    on conflict (id) do nothing;
  end if;
end$$;


-- 2.6 events (cerrado; sólo service_role)
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid,
  type       text not null,
  payload    jsonb,
  -- Observability fields (optional)
  source     text,
  entity_id  text,
  dedupe_key text,
  created_at timestamptz not null default now()
);
create index if not exists idx_events_type       on public.events(type);
create index if not exists idx_events_created_at on public.events(created_at);
create index if not exists idx_events_source     on public.events(source);
create index if not exists idx_events_entity_id  on public.events(entity_id);
create index if not exists idx_events_dedupe_key on public.events(dedupe_key);

-- Optional dedupe support (best-effort)
create unique index if not exists events_type_dedupe_key_uniq
  on public.events(type, dedupe_key)
  where dedupe_key is not null;

alter table public.events enable row level security;

-- (silenciar "RLS enabled, no policy") → deny-all explícito
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='events') then
    create policy events_deny_all on public.events
      for all to anon, authenticated using (false) with check (false);
  end if;
end$$;


-- 2.7 event_locks (idempotencia; cerrado; sólo service_role)
create table if not exists public.event_locks (
  key        text primary key,
  created_at timestamptz not null default now()
);

alter table public.event_locks enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='event_locks') then
    create policy event_locks_deny_all on public.event_locks
      for all to anon, authenticated using (false) with check (false);
  end if;
end$$;


-- ─────────────────────────────────────────────────────────────
-- 3) CRM (P2) — Lead → Cliente → Conversaciones → Preferencias
--     Seguridad: admin-only via RLS helper is_admin()
-- ─────────────────────────────────────────────────────────────

-- 3.1 Roles simples (admin) para RLS
create table if not exists public.user_roles (
  user_id    uuid primary key,
  role       text not null check (role in ('admin')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_roles') then
    create policy user_roles_deny_all on public.user_roles
      for all to anon, authenticated using (false) with check (false);
  end if;
end$$;

create or replace function public.is_admin(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = p_uid and ur.role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;

-- 3.2 Extender events para analítica/relaciones (compatible con lo existente)
alter table public.events add column if not exists source text;
alter table public.events add column if not exists entity_id uuid;
alter table public.events add column if not exists dedupe_key text;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname='public' and tablename='events' and indexname='uq_events_dedupe_key'
  ) then
    execute 'create unique index uq_events_dedupe_key on public.events(dedupe_key) where dedupe_key is not null';
  end if;
end$$;

create index if not exists idx_events_source    on public.events(source);
create index if not exists idx_events_entity_id on public.events(entity_id);

-- 3.3 Customers (CRM)
create table if not exists public.customers (
  id         uuid primary key default gen_random_uuid(),
  email      text unique,
  name       text,
  phone      text,
  country    text,
  language   text,
  created_at timestamptz not null default now()
);
create index if not exists idx_customers_email on public.customers(lower(email));
create index if not exists idx_customers_country on public.customers(country);
create index if not exists idx_customers_language on public.customers(language);

alter table public.customers enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='customers' and policyname='customers_admin_all') then
    create policy customers_admin_all on public.customers
      for all to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end$$;

-- 3.4 Leads (CRM)
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  email      text,
  whatsapp   text,
  source     text, -- chat/blog/ads/web/etc
  language   text,
  customer_id uuid references public.customers(id) on delete set null,
  stage      text not null default 'new' check (stage in ('new','qualified','proposal','won','lost')),
  tags       text[] not null default '{}'::text[],
  notes      text,
  created_at timestamptz not null default now()
);

-- Backfill / migrations: leads.customer_id
do $$
begin
  alter table public.leads add column if not exists customer_id uuid;
exception when others then
  -- ignore
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'leads_customer_id_fkey'
  ) then
    alter table public.leads
      add constraint leads_customer_id_fkey
      foreign key (customer_id) references public.customers(id) on delete set null;
  end if;
end $$;

create index if not exists idx_leads_stage on public.leads(stage);
create index if not exists idx_leads_language on public.leads(language);
create index if not exists idx_leads_email on public.leads(lower(email));
create index if not exists idx_leads_source on public.leads(source);
create index if not exists idx_leads_tags_gin on public.leads using gin(tags);
create index if not exists idx_leads_customer_id on public.leads(customer_id);

alter table public.leads enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='leads' and policyname='leads_admin_all') then
    create policy leads_admin_all on public.leads
      for all to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end$$;


-- 3.4.2 Deals + Tasks (CRM: oportunidades y tareas operativas)
create table if not exists public.deals (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  tour_slug   text,
  title       text not null default 'Tour booking',
  stage       text not null default 'new' check (stage in ('new','qualified','proposal','checkout','won','lost')),
  amount_minor int,
  currency    text not null default 'eur',
  probability int not null default 20 check (probability >= 0 and probability <= 100),
  assigned_to text,
  notes       text,
  source      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  closed_at   timestamptz
);

create index if not exists idx_deals_stage on public.deals(stage);
create index if not exists idx_deals_lead_id on public.deals(lead_id);
create index if not exists idx_deals_customer_id on public.deals(customer_id);
create index if not exists idx_deals_updated_at on public.deals(updated_at);
create index if not exists idx_deals_tour_slug on public.deals(tour_slug);

-- Un deal activo por lead+tourslug (mejor UX operacional). Permite múltiples si el usuario cambia de tour.
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='uq_deals_active_lead_tour'
  ) then
    execute 'create unique index uq_deals_active_lead_tour on public.deals(lead_id, tour_slug) where stage not in (''won'',''lost'')';
  end if;
end$$;

drop trigger if exists trg_deals_updated_at on public.deals;
create trigger trg_deals_updated_at
before update on public.deals
for each row execute function public.set_updated_at();

alter table public.deals enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='deals' and policyname='deals_admin_all') then
    create policy deals_admin_all on public.deals
      for all to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end$$;

create table if not exists public.deal_notes (
  id        uuid primary key default gen_random_uuid(),
  deal_id   uuid not null references public.deals(id) on delete cascade,
  body      text not null,
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists idx_deal_notes_deal_id on public.deal_notes(deal_id);

alter table public.deal_notes enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='deal_notes' and policyname='deal_notes_admin_all') then
    create policy deal_notes_admin_all on public.deal_notes
      for all to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end$$;

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid references public.deals(id) on delete cascade,

  -- NOTA: no ponemos FK aquí para evitar error si tickets aún no existe.
  ticket_id   uuid,

  title       text not null,
  status      text not null default 'open' check (status in ('open','in_progress','done','canceled')),
  priority    text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  assigned_to text,
  due_at      timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_priority on public.tasks(priority);
create index if not exists idx_tasks_deal_id on public.tasks(deal_id);
create index if not exists idx_tasks_ticket_id on public.tasks(ticket_id);
create index if not exists idx_tasks_due_at on public.tasks(due_at);

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname='public' and tablename='tasks' and policyname='tasks_admin_all'
  ) then
    create policy tasks_admin_all on public.tasks
      for all to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end$$;


-- 3.4.1 Segments (saved filters for admin operations)
create table if not exists public.segments (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  entity_type   text not null check (entity_type in ('leads','customers')),
  filter        jsonb not null default '{}'::jsonb,
  description   text,
  last_run_at   timestamptz,
  last_run_count int,
  created_at    timestamptz not null default now()
);

create index if not exists idx_segments_entity_type on public.segments(entity_type);
create unique index if not exists uq_segments_name_entity on public.segments(lower(name), entity_type);

alter table public.segments enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='segments' and policyname='segments_admin_all') then
    create policy segments_admin_all on public.segments
      for all to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end$$;

-- 3.5 Conversations + Messages (CRM)
-- IMPORTANT: Esta definición está alineada con el código actual (APIs admin, smoke tests).
-- conversaciones: locale + status + updated_at, y channel limitado para cumplir CHECKs.
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  channel     text not null check (channel in ('web','whatsapp','email','chat')),
  locale      text not null default 'es' check (locale in ('es','en','fr','de')),
  status      text not null default 'open' check (status in ('open','closed')),
  started_at  timestamptz not null default now(),
  closed_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

do $$
begin
  -- Allow anonymous conversations (e.g., public webchat before lead capture).
  if exists (select 1 from pg_constraint where conname='conversations_owner_check') then
    alter table public.conversations drop constraint conversations_owner_check;
  end if;
end$$;

drop trigger if exists trg_conversations_updated on public.conversations;
create trigger trg_conversations_updated
before update on public.conversations
for each row execute function public.set_updated_at();

create index if not exists idx_conversations_lead_id on public.conversations(lead_id);
create index if not exists idx_conversations_customer_id on public.conversations(customer_id);
create index if not exists idx_conversations_channel on public.conversations(channel);
create index if not exists idx_conversations_status on public.conversations(status);
create index if not exists idx_conversations_created_at on public.conversations(created_at);
create index if not exists idx_conversations_updated_at on public.conversations(updated_at);

alter table public.conversations enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='conversations_admin_all') then
    create policy conversations_admin_all on public.conversations
      for all to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end$$;

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            text not null check (role in ('user','assistant','agent')),
  content         text not null,
  meta            jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_created_at on public.messages(created_at);

alter table public.messages enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='messages_admin_all') then
    create policy messages_admin_all on public.messages
      for all to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end$$;

-- 3.6 Preferences (perfilado del lead/cliente; útil para bot/segmentación)
create table if not exists public.preferences (
  id           uuid primary key default gen_random_uuid(),
  owner_type   text not null check (owner_type in ('lead','customer')),
  owner_id     uuid not null,
  interests    jsonb,
  budget_range jsonb,
  cities       text[] not null default '{}'::text[],
  travel_dates jsonb,
  pax          int,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname='preferences_owner_unique') then
    alter table public.preferences add constraint preferences_owner_unique unique (owner_type, owner_id);
  end if;
end$$;

drop trigger if exists trg_preferences_updated on public.preferences;
create trigger trg_preferences_updated
before update on public.preferences
for each row execute function public.set_updated_at();

create index if not exists idx_preferences_owner on public.preferences(owner_type, owner_id);

alter table public.preferences enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='preferences' and policyname='preferences_admin_all') then
    create policy preferences_admin_all on public.preferences
      for all to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end$$;

-- NOTA: El sitio público NO tiene grants a estas tablas (CRM). Acceso recomendado:
-- - APIs /api/admin/* (Basic Auth + service role) para operación
-- - /api/leads (service role) para captación controlada con consentimiento

-- 3.7 Tickets (handoff humano)
create table if not exists public.tickets (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  lead_id         uuid references public.leads(id) on delete set null,
  customer_id     uuid references public.customers(id) on delete set null,
  subject         text not null default 'Support request',
  summary         text,
  status          text not null default 'open' check (status in ('open','pending','in_progress','resolved')),
  priority        text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  channel         text not null default 'chat' check (channel in ('web','chat','email','whatsapp','phone','other')),
  assigned_to     uuid,
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  closed_at       timestamptz,
  resolved_at     timestamptz
);

create index if not exists idx_tickets_conversation_id on public.tickets(conversation_id);
create index if not exists idx_tickets_status on public.tickets(status);
create index if not exists idx_tickets_priority on public.tickets(priority);
create index if not exists idx_tickets_created_at on public.tickets(created_at);
create index if not exists idx_tickets_last_message_at on public.tickets(last_message_at);
create index if not exists idx_tickets_updated_at on public.tickets(updated_at);

-- One active ticket per conversation (open/pending)
create unique index if not exists uq_tickets_active_per_conversation
  on public.tickets(conversation_id)
  where status in ('open','pending','in_progress');

drop trigger if exists trg_tickets_updated on public.tickets;
create trigger trg_tickets_updated
before update on public.tickets
for each row execute function public.set_updated_at();

alter table public.tickets enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tickets' and policyname='tickets_admin_all') then
    create policy tickets_admin_all on public.tickets
      for all to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end$$;

-- --- PATCH: FK tasks.ticket_id -> tickets(id) (after tickets exists) ---
DO $$
BEGIN
  -- Solo agrega la FK si tickets existe (idempotente).
  IF to_regclass('public.tickets') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'tasks_ticket_id_fkey'
    ) THEN
      ALTER TABLE public.tasks
        ADD CONSTRAINT tasks_ticket_id_fkey
        FOREIGN KEY (ticket_id)
        REFERENCES public.tickets(id)
        ON DELETE SET NULL;
    END IF;
  END IF;
END $$;


-- ============================================================
-- FIN ✅
-- ============================================================

-- ---------------------------------------------------------------------------
-- Metrics helpers (admin-only)
-- These functions power /api/admin/metrics/by-tour and /api/admin/metrics/by-city.
-- Apply this SQL once per environment.
-- ---------------------------------------------------------------------------

create or replace function public.metrics_by_tour(p_from timestamptz, p_to timestamptz)
returns table (
  tour_slug text,
  tour_title text,
  city text,
  tour_views int,
  checkout_started int,
  checkout_paid int
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      coalesce(payload->>'tour_slug', payload->'meta'->>'tour_slug', payload->>'slug', payload->'meta'->>'slug') as tour_slug,
      type
    from public.events
    where created_at >= p_from
      and created_at < p_to
      and type in ('tour.view','checkout.started','checkout.paid')
  ),
  agg as (
    select
      tour_slug,
      count(*) filter (where type='tour.view')::int as tour_views,
      count(*) filter (where type='checkout.started')::int as checkout_started,
      count(*) filter (where type='checkout.paid')::int as checkout_paid
    from base
    where tour_slug is not null and tour_slug <> ''
    group by tour_slug
  )
  select
    a.tour_slug,
    t.title as tour_title,
    t.city,
    a.tour_views,
    a.checkout_started,
    a.checkout_paid
  from agg a
  left join public.tours t on t.slug = a.tour_slug
  order by a.checkout_paid desc, a.checkout_started desc, a.tour_views desc;
$$;

revoke all on function public.metrics_by_tour(timestamptz, timestamptz) from public;

create or replace function public.metrics_by_city(p_from timestamptz, p_to timestamptz)
returns table (
  city text,
  tour_views int,
  checkout_started int,
  checkout_paid int
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      coalesce(payload->>'tour_slug', payload->'meta'->>'tour_slug', payload->>'slug', payload->'meta'->>'slug') as tour_slug,
      type
    from public.events
    where created_at >= p_from
      and created_at < p_to
      and type in ('tour.view','checkout.started','checkout.paid')
  ),
  agg_by_slug as (
    select
      tour_slug,
      count(*) filter (where type='tour.view')::int as tour_views,
      count(*) filter (where type='checkout.started')::int as checkout_started,
      count(*) filter (where type='checkout.paid')::int as checkout_paid
    from base
    where tour_slug is not null and tour_slug <> ''
    group by tour_slug
  )
  select
    coalesce(t.city, '—') as city,
    sum(a.tour_views)::int as tour_views,
    sum(a.checkout_started)::int as checkout_started,
    sum(a.checkout_paid)::int as checkout_paid
  from agg_by_slug a
  left join public.tours t on t.slug = a.tour_slug
  group by 1
  order by 4 desc, 3 desc, 2 desc;
$$;

revoke all on function public.metrics_by_city(timestamptz, timestamptz) from public;

/* ─────────────────────────────────────────────────────────────
   4.2 Content Hub (Blog + Vlog) — posts/videos
   ───────────────────────────────────────────────────────────── */

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text null,
  content_md text not null default '',
  cover_url text null,
  tags text[] not null default '{}',
  lang text not null default 'es',
  status text not null default 'draft',
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_lang_check') then
    alter table public.posts add constraint posts_lang_check check (lang in ('es','en','fr','de'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'posts_status_check') then
    alter table public.posts add constraint posts_status_check check (status in ('draft','published'));
  end if;
end $$;

create index if not exists idx_posts_published_at on public.posts (published_at desc);
create index if not exists idx_posts_tags_gin on public.posts using gin(tags);
create index if not exists idx_posts_lang_status on public.posts (lang, status);

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at before update on public.posts
for each row execute function public.set_updated_at();

-- Public read only published
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='posts' and policyname='posts_public_read_published') then
    create policy posts_public_read_published
      on public.posts
      for select
      to anon, authenticated
      using (status = 'published' and published_at is not null);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='posts' and policyname='posts_admin_all') then
    create policy posts_admin_all
      on public.posts
      for all
      to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end $$;

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text null,
  youtube_url text not null,
  cover_url text null,
  tags text[] not null default '{}',
  lang text not null default 'es',
  status text not null default 'draft',
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.videos enable row level security;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'videos_lang_check') then
    alter table public.videos add constraint videos_lang_check check (lang in ('es','en','fr','de'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'videos_status_check') then
    alter table public.videos add constraint videos_status_check check (status in ('draft','published'));
  end if;
end $$;

create index if not exists idx_videos_published_at on public.videos (published_at desc);
create index if not exists idx_videos_tags_gin on public.videos using gin(tags);
create index if not exists idx_videos_lang_status on public.videos (lang, status);

drop trigger if exists trg_videos_updated_at on public.videos;
create trigger trg_videos_updated_at before update on public.videos
for each row execute function public.set_updated_at();

-- Public read only published
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='videos' and policyname='videos_public_read_published') then
    create policy videos_public_read_published
      on public.videos
      for select
      to anon, authenticated
      using (status = 'published' and published_at is not null);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='videos' and policyname='videos_admin_all') then
    create policy videos_admin_all
      on public.videos
      for all
      to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end $$;


/* ─────────────────────────────────────────────────────────────
   4.3 Captura que convierte — Newsletter + Wishlist
   ───────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────
   P4.3 Captura que convierte — Newsletter + Wishlist
   Patch idempotente.

   Requisitos previos (ya existen en tu schema):
   - public.set_updated_at()
   - public.is_admin(auth.uid())
   - public.tours(id)
   ───────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────
   Newsletter (double opt-in)
   ───────────────────────────────────────────────────────────── */

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'pending',
  confirm_token_hash text null,
  unsubscribe_token_hash text null,
  visitor_id text null,
  source text null,
  utm jsonb null,
  token_sent_at timestamptz null,
  confirmed_at timestamptz null,
  unsubscribed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.newsletter_subscriptions enable row level security;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'newsletter_status_check') then
    alter table public.newsletter_subscriptions
      add constraint newsletter_status_check
      check (status in ('pending','confirmed','unsubscribed'));
  end if;
end $$;

create index if not exists idx_newsletter_status on public.newsletter_subscriptions (status);
create index if not exists idx_newsletter_created_at on public.newsletter_subscriptions (created_at desc);

drop trigger if exists trg_newsletter_updated_at on public.newsletter_subscriptions;
create trigger trg_newsletter_updated_at
before update on public.newsletter_subscriptions
for each row execute function public.set_updated_at();

-- Admin-only access (panel / auditoría). Escrituras públicas se hacen vía API (service role).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='newsletter_subscriptions' and policyname='newsletter_admin_all'
  ) then
    create policy newsletter_admin_all
      on public.newsletter_subscriptions
      for all
      to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end $$;


/* ─────────────────────────────────────────────────────────────
   Wishlist / Favoritos (requiere login)
   ───────────────────────────────────────────────────────────── */

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wishlists enable row level security;

drop trigger if exists trg_wishlists_updated_at on public.wishlists;
create trigger trg_wishlists_updated_at
before update on public.wishlists
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='wishlists' and policyname='wishlists_owner_all'
  ) then
    create policy wishlists_owner_all
      on public.wishlists
      for all
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='wishlists' and policyname='wishlists_admin_all'
  ) then
    create policy wishlists_admin_all
      on public.wishlists
      for all
      to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end $$;

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  tour_id uuid not null references public.tours (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.wishlist_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'wishlist_items_unique') then
    alter table public.wishlist_items
      add constraint wishlist_items_unique unique (wishlist_id, tour_id);
  end if;
end $$;

create index if not exists idx_wishlist_items_tour on public.wishlist_items (tour_id);
create index if not exists idx_wishlist_items_created_at on public.wishlist_items (created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='wishlist_items' and policyname='wishlist_items_owner_all'
  ) then
    create policy wishlist_items_owner_all
      on public.wishlist_items
      for all
      to authenticated
      using (
        exists (
          select 1 from public.wishlists w
          where w.id = wishlist_id and w.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.wishlists w
          where w.id = wishlist_id and w.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='wishlist_items' and policyname='wishlist_items_admin_all'
  ) then
    create policy wishlist_items_admin_all
      on public.wishlist_items
      for all
      to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────
-- Migrations (idempotent)
-- ─────────────────────────────────────────────────────────────
alter table if exists public.bookings add column if not exists deal_id uuid references public.deals(id) on delete set null;
create index if not exists idx_bookings_deal_id on public.bookings(deal_id);
