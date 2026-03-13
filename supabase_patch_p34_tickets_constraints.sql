-- KCE 3.0 (P3.4) — Tickets constraints alignment
-- Purpose:
-- 1) Allow tickets.status = 'in_progress' (used by /api/admin/tickets/[id]/reply)
-- 2) Allow tickets.channel = 'web' (so we can create tickets from web funnels)
--
-- Safe to run multiple times.

begin;

-- 1) tickets.status CHECK
alter table public.tickets
  drop constraint if exists tickets_status_check;

alter table public.tickets
  add constraint tickets_status_check
  check (
    status = any (
      array[
        'open'::text,
        'pending'::text,
        'in_progress'::text,
        'resolved'::text
      ]
    )
  );

-- 2) tickets.channel CHECK
alter table public.tickets
  drop constraint if exists tickets_channel_check;

alter table public.tickets
  add constraint tickets_channel_check
  check (
    channel = any (
      array[
        'chat'::text,
        'email'::text,
        'whatsapp'::text,
        'web'::text,
        'phone'::text,
        'other'::text
      ]
    )
  );

commit;
