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
