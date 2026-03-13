-- supabase_patch_p53_attribution_cta.sql
-- P22: Attribution snapshot on deals (CTA + landing + UTM)
--
-- Notes:
-- - These columns are OPTIONAL. Code writes them best-effort.
-- - No PII stored (paths are stored without query strings).

begin;

alter table if exists public.deals
  add column if not exists last_cta text,
  add column if not exists last_cta_page text,
  add column if not exists last_cta_at timestamptz,
  add column if not exists landing_path text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists gclid text,
  add column if not exists fbclid text;

-- Helpful indexes for Revenue Ops / attribution queries
create index if not exists deals_last_cta_idx on public.deals (last_cta);
create index if not exists deals_utm_campaign_idx on public.deals (utm_campaign);
create index if not exists deals_utm_source_idx on public.deals (utm_source);

commit;
