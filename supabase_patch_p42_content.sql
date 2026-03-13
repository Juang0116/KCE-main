-- Patch: Content Hub (Blog + Vlog) — posts/videos
-- Safe to run multiple times.

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
