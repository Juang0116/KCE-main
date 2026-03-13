-- supabase_patch_p3.sql
-- Apply on existing environments when moving to P3 (chatbot persistence).
-- 1) Allow anonymous conversations (public webchat before lead capture)
do $$
begin
  if exists (select 1 from pg_constraint where conname='conversations_owner_check') then
    alter table public.conversations drop constraint conversations_owner_check;
  end if;
end$$;
