-- supabase_patch_p76_consent_compliance.sql
-- Cookie/consent preferences + audit trail.

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  vid text not null,
  preferences jsonb not null default '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(vid)
);

create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  vid text,
  kind text not null, -- 'accepted','rejected','updated'
  preferences jsonb not null default '{}'::jsonb,
  page text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_user_consents_updated_at') then
    create trigger trg_user_consents_updated_at before update on public.user_consents
    for each row execute function public.kce_set_updated_at();
  end if;
end $$;
