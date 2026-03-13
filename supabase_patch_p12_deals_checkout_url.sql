-- P12: Persist checkout link (Stripe) in the CRM deal to enable automatic follow-ups.
-- Safe to run multiple times.

alter table public.deals
  add column if not exists checkout_url text;

alter table public.deals
  add column if not exists stripe_session_id text;

create index if not exists deals_stage_updated_idx on public.deals (stage, updated_at desc);
