-- supabase_patch_p33_tickets.sql
-- Apply this in existing environments to add tickets (handoff humano).
-- Safe/idempotent.

begin;

create table if not exists public.tickets (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  lead_id         uuid references public.leads(id) on delete set null,
  customer_id     uuid references public.customers(id) on delete set null,
  summary         text not null,
  status          text not null default 'open' check (status in ('open','pending','resolved')),
  priority        text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  assigned_to     uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  resolved_at     timestamptz
);

create index if not exists idx_tickets_conversation_id on public.tickets(conversation_id);
create index if not exists idx_tickets_status on public.tickets(status);
create index if not exists idx_tickets_priority on public.tickets(priority);
create index if not exists idx_tickets_created_at on public.tickets(created_at);

create unique index if not exists uq_tickets_active_per_conversation
  on public.tickets(conversation_id)
  where status in ('open','pending');

drop trigger if exists trg_tickets_updated on public.tickets;
create trigger trg_tickets_updated
before update on public.tickets
for each row execute function public.set_updated_at();

alter table public.tickets enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tickets' and policyname='tickets_admin_all') then
    create policy tickets_admin_all on public.tickets
      for all to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end$$;

commit;
