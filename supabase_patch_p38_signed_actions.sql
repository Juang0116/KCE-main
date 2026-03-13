-- P38: Signed Actions (Admin) - replay protection table
-- Run in Supabase SQL editor (public schema).

create table if not exists public.action_nonces (
  nonce text primary key,
  actor text not null,
  exp_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists action_nonces_exp_at_idx on public.action_nonces (exp_at);

-- Optional cleanup:
-- delete from public.action_nonces where exp_at < now() - interval '1 day';
