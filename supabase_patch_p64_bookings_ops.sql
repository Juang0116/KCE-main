-- supabase_patch_p64_bookings_ops.sql
-- Booking operations fields (cancel/reschedule/refund/voucher) + admin notes.
-- Safe to run multiple times.

begin;

alter table public.bookings
  add column if not exists cancel_requested_at timestamptz null,
  add column if not exists cancel_requested_reason text null,
  add column if not exists reschedule_requested_at timestamptz null,
  add column if not exists reschedule_requested_to date null,
  add column if not exists refund_requested_at timestamptz null,
  add column if not exists refund_processed_at timestamptz null,
  add column if not exists refund_amount_minor integer null,
  add column if not exists voucher_code text null,
  add column if not exists voucher_amount_minor integer null,
  add column if not exists ops_notes text null;

create index if not exists bookings_cancel_requested_at_idx on public.bookings(cancel_requested_at);
create index if not exists bookings_refund_requested_at_idx on public.bookings(refund_requested_at);

commit;
