-- supabase_patch_p78_fx_cohorts.sql
-- FX daily rates + lightweight cohort tables for executive analytics.

create table if not exists public.fx_rates_daily (
  day date not null,
  base_currency text not null check (char_length(base_currency)=3),
  quote_currency text not null check (char_length(quote_currency)=3),
  rate numeric(18,8) not null check (rate > 0),
  source text,
  created_at timestamptz not null default now(),
  primary key (day, base_currency, quote_currency)
);

-- optional materialized cohort cache (can be recomputed)
create table if not exists public.analytics_customer_cohorts (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  first_paid_at timestamptz,
  first_paid_booking_id uuid,
  first_paid_amount_minor int,
  currency text,
  first_touch_source text,
  first_touch_campaign text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_cohorts_updated_at') then
    create trigger trg_cohorts_updated_at before update on public.analytics_customer_cohorts
    for each row execute function public.kce_set_updated_at();
  end if;
end $$;
