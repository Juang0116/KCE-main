-- supabase_patch_p49_outbound_closed_loop.sql
-- P11: Closed-loop signals for outbound (reply + paid attribution)
-- Safe to run multiple times.

begin;

-- Outcome pipeline: none -> replied -> paid/lost
alter table public.crm_outbound_messages
  add column if not exists outcome text not null default 'none'
    check (outcome in ('none','replied','paid','lost'));

-- Reply tracking (manual or via inbound webhooks in the future)
alter table public.crm_outbound_messages
  add column if not exists replied_at timestamptz null;

alter table public.crm_outbound_messages
  add column if not exists replied_note text null;

-- Paid attribution (set when deal is won / booking is created)
alter table public.crm_outbound_messages
  add column if not exists attributed_won_at timestamptz null;

alter table public.crm_outbound_messages
  add column if not exists attributed_booking_id uuid null references public.bookings(id) on delete set null;

-- Helpful indexes for reporting
create index if not exists crm_outbound_outcome_sent
  on public.crm_outbound_messages (outcome, sent_at desc);

create index if not exists crm_outbound_deal_outcome_sent
  on public.crm_outbound_messages (deal_id, outcome, sent_at desc);

create index if not exists crm_outbound_replied_at
  on public.crm_outbound_messages (replied_at desc);

commit;
