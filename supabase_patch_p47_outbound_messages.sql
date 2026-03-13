-- supabase_patch_p47_outbound_messages.sql
-- Outbound message queue (email/whatsapp) for CRM.
-- Safe to run multiple times.

begin;

create table if not exists public.crm_outbound_messages (
  id uuid primary key default gen_random_uuid(),

  deal_id uuid null references public.deals(id) on delete set null,
  ticket_id uuid null references public.tickets(id) on delete set null,
  lead_id uuid null references public.leads(id) on delete set null,
  customer_id uuid null references public.customers(id) on delete set null,

  channel text not null default 'whatsapp' check (channel in ('whatsapp','email')),
  provider text not null default 'manual', -- manual | resend | future
  status text not null default 'draft'
    check (status in ('draft','queued','sending','sent','failed','canceled')),

  to_email text null,
  to_phone text null,

  subject text null,
  body text not null default '',

  template_key text null,
  template_variant text null,

  error text null,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz null
);

-- helpful indexes
create index if not exists crm_outbound_status_created
  on public.crm_outbound_messages (status, created_at desc);

create index if not exists crm_outbound_deal
  on public.crm_outbound_messages (deal_id, created_at desc);

create index if not exists crm_outbound_ticket
  on public.crm_outbound_messages (ticket_id, created_at desc);

create index if not exists crm_outbound_to_email
  on public.crm_outbound_messages (to_email);

create index if not exists crm_outbound_to_phone
  on public.crm_outbound_messages (to_phone);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_crm_outbound_updated_at on public.crm_outbound_messages;
create trigger trg_crm_outbound_updated_at
before update on public.crm_outbound_messages
for each row execute function public.set_updated_at();

-- RLS: locked by default (admin API uses service role)
alter table public.crm_outbound_messages enable row level security;

commit;
