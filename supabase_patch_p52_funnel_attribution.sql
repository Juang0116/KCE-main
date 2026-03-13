-- supabase_patch_p52_funnel_attribution.sql
-- P17: Attribution + funnel clarity
-- Adds indexes to speed up stage-funnel aggregation and attribution joins.
-- Safe to run multiple times.

begin;

-- Outbound message funnel queries
create index if not exists crm_outbound_messages_sent_at_idx
  on public.crm_outbound_messages (sent_at desc);

create index if not exists crm_outbound_messages_deal_sent_idx
  on public.crm_outbound_messages (deal_id, sent_at desc);

create index if not exists crm_outbound_messages_outcome_idx
  on public.crm_outbound_messages (outcome);

create index if not exists crm_outbound_messages_template_idx
  on public.crm_outbound_messages (template_key, template_variant, channel);

-- Deals lookup for checkout-open and win attribution
create index if not exists deals_checkout_opened_at_idx
  on public.deals (checkout_opened_at desc);

create index if not exists deals_closed_at_idx
  on public.deals (closed_at desc);

commit;
