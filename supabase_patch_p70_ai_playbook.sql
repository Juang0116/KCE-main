-- supabase_patch_p70_ai_playbook.sql
-- P70 (P7): AI Playbook (human-approved knowledge snippets) + optional insights storage.
--
-- Goal
-- - Give the AI a curated, admin-managed “playbook” (policies, FAQ answers, tone, escalation rules).
-- - Keep it safe: only *approved* snippets are injected into /api/ai.
-- - No automatic model fine-tuning. This is retrieval + prompt injection from approved content.

-- Requires pgcrypto for gen_random_uuid (Supabase usually has it enabled).

create table if not exists public.ai_playbook_snippets (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 180),
  content text not null check (char_length(content) between 20 and 5000),
  tags text[] not null default '{}'::text[],
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_playbook_snippets_enabled_updated_idx
  on public.ai_playbook_snippets (enabled, updated_at desc);

-- Optional: store “insight runs” (human-in-the-loop). Not required for core playbook usage.
create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'conversations',
  source_id uuid,
  summary text not null check (char_length(summary) between 20 and 8000),
  topics text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

create index if not exists ai_insights_created_at_idx on public.ai_insights (created_at desc);

-- RLS: only service-role (or your own policies) should manage these.
alter table public.ai_playbook_snippets enable row level security;
alter table public.ai_insights enable row level security;

-- NOTE: We intentionally do NOT add permissive anon/auth policies here.
-- Admin endpoints use service-role (SUPABASE_SERVICE_ROLE_KEY).

-- updated_at trigger helper
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'kce_set_updated_at') then
    create function public.kce_set_updated_at()
    returns trigger language plpgsql as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$;
  end if;
end $$;

drop trigger if exists trg_ai_playbook_snippets_updated_at on public.ai_playbook_snippets;
create trigger trg_ai_playbook_snippets_updated_at
before update on public.ai_playbook_snippets
for each row execute function public.kce_set_updated_at();
