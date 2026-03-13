-- supabase_patch_p54_multitouch_attribution.sql
-- Adds optional first-touch attribution fields to deals for multi-touch analysis.

alter table public.deals
  add column if not exists first_cta text,
  add column if not exists first_cta_page text,
  add column if not exists first_cta_at timestamptz;

-- Indexes to speed up admin reporting (best-effort)
create index if not exists deals_first_cta_idx on public.deals (first_cta);
create index if not exists deals_first_cta_at_idx on public.deals (first_cta_at);
