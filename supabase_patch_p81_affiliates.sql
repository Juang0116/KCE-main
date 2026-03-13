-- P81 — Affiliates / Partners
-- Affiliate program tables + minimal RLS.

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  email text,
  status text not null default 'active' check (status in ('active','paused','closed')),
  commission_bps integer not null default 1000 check (commission_bps >= 0 and commission_bps <= 5000),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists affiliates_code_idx on public.affiliates (code);

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_code text not null,
  vid text,
  utm_key text,
  page text,
  referrer text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_clicks_code_created_idx on public.affiliate_clicks (affiliate_code, created_at desc);

create table if not exists public.affiliate_conversions (
  id uuid primary key default gen_random_uuid(),
  affiliate_code text not null,
  stripe_session_id text not null unique,
  booking_id uuid,
  amount_minor integer,
  currency text,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_conversions_code_created_idx on public.affiliate_conversions (affiliate_code, created_at desc);

create table if not exists public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_code text not null,
  period_start date not null,
  period_end date not null,
  amount_minor integer not null default 0,
  currency text not null default 'EUR' check (char_length(currency)=3),
  status text not null default 'pending' check (status in ('pending','approved','paid','void')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(affiliate_code, period_start, period_end)
);

create index if not exists affiliate_payouts_code_period_idx on public.affiliate_payouts (affiliate_code, period_start desc);

-- RLS
alter table public.affiliates enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.affiliate_conversions enable row level security;
alter table public.affiliate_payouts enable row level security;

-- Default: no public reads.
drop policy if exists "affiliates_no_select" on public.affiliates;
create policy "affiliates_no_select" on public.affiliates
for select to anon
using (false);

drop policy if exists "affiliate_clicks_no_select" on public.affiliate_clicks;
create policy "affiliate_clicks_no_select" on public.affiliate_clicks
for select to anon
using (false);

-- Allow anonymous insert of affiliate clicks (API already enforces Origin + rate limit).
drop policy if exists "affiliate_clicks_anon_insert" on public.affiliate_clicks;
create policy "affiliate_clicks_anon_insert" on public.affiliate_clicks
for insert to anon
with check (true);

-- Deny anon for conversions and payouts.
drop policy if exists "affiliate_conversions_no_anon" on public.affiliate_conversions;
create policy "affiliate_conversions_no_anon" on public.affiliate_conversions
for all to anon
using (false)
with check (false);

drop policy if exists "affiliate_payouts_no_anon" on public.affiliate_payouts;
create policy "affiliate_payouts_no_anon" on public.affiliate_payouts
for all to anon
using (false)
with check (false);
