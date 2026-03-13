-- supabase_patch_tickets_full.sql
-- Adds missing columns to support Admin Tickets UI/API.
-- Safe/idempotent.

begin;

-- Add columns (idempotent)
alter table public.tickets
  add column if not exists subject text;

alter table public.tickets
  add column if not exists channel text;

alter table public.tickets
  add column if not exists last_message_at timestamptz;

alter table public.tickets
  add column if not exists closed_at timestamptz;

-- Defaults / backfill
update public.tickets set subject = coalesce(subject, 'Support request') where subject is null;
update public.tickets set channel = coalesce(channel, 'chat') where channel is null;

alter table public.tickets alter column subject set default 'Support request';
alter table public.tickets alter column channel set default 'chat';
alter table public.tickets alter column channel set not null;

-- summary can be nullable to avoid breaking existing inserts; API/UI already handles nulls.

-- Constraints (drop old if exists, then add desired)
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'tickets_channel_check') then
    alter table public.tickets drop constraint tickets_channel_check;
  end if;
  alter table public.tickets
    add constraint tickets_channel_check
    check (channel in ('chat','email','whatsapp','phone','other'));
exception when others then
  -- ignore if concurrent
end$$;

commit;
