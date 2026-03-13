-- supabase_patch_p36_signed_actions.sql
-- P36 (hardening): Signed Actions anti-replay table
--
-- Used by src/lib/signedActions.server.ts to prevent replay of admin mutation tokens.
-- Safe to run multiple times.

begin;

create table if not exists public.action_nonces (
  nonce text primary key,
  exp timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_action_nonces_exp on public.action_nonces(exp);

-- Optional cleanup helper (manual/cron): delete expired nonces
-- delete from public.action_nonces where exp < now() - interval '1 day';

commit;
