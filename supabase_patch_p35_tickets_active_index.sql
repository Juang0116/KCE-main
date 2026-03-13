-- supabase_patch_p35_tickets_active_index.sql
-- Align tickets "active" uniqueness with current workflow:
-- one non-resolved ticket per conversation (open/pending/in_progress).
-- Adds missing indexes useful for Admin UI ordering.
-- Safe/idempotent.

begin;

drop index if exists public.uq_tickets_active_per_conversation;

create unique index if not exists uq_tickets_active_per_conversation
  on public.tickets(conversation_id)
  where status in ('open','pending','in_progress');

create index if not exists idx_tickets_last_message_at on public.tickets(last_message_at);
create index if not exists idx_tickets_updated_at on public.tickets(updated_at);

commit;
