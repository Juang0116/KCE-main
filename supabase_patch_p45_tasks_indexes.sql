-- supabase_patch_p45_tasks_indexes.sql
-- Goal: speed up ops queries and ticket/deal scoped task lookups.
-- Safe to run multiple times.

create index if not exists tasks_ticket_id_idx on public.tasks (ticket_id);
create index if not exists tasks_deal_id_idx on public.tasks (deal_id);
create index if not exists tasks_due_at_idx on public.tasks (due_at);
create index if not exists tickets_status_priority_idx on public.tickets (status, priority);

-- Optional (only if you have many deals):
create index if not exists deals_stage_updated_at_idx on public.deals (stage, updated_at desc);