-- supabase_patch_p75_sequences.sql
-- Outbound sequences (drip campaigns) for email/whatsapp.
-- Safe to run multiple times (IF NOT EXISTS).

create table if not exists public.crm_sequences (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  status text not null default 'active' check (status in ('draft','active','paused','archived')),
  description text,
  segment_key text,
  entry_event text, -- e.g. 'checkout.abandoned', 'lead.created'
  channel text not null default 'email' check (channel in ('email','whatsapp','mixed')),
  locale text default 'es',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.crm_sequences(id) on delete cascade,
  step_index int not null,
  delay_minutes int not null default 0 check (delay_minutes >= 0),
  channel text not null check (channel in ('email','whatsapp')),
  template_key text,
  template_variant text,
  subject text,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(sequence_id, step_index)
);

create table if not exists public.crm_sequence_enrollments (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.crm_sequences(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','completed','canceled','failed')),
  -- target pointers (one of these)
  deal_id uuid references public.deals(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,

  current_step int not null default 0,
  next_run_at timestamptz not null default now(),
  last_error text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_sequence_enrollments_next_run_idx
  on public.crm_sequence_enrollments(next_run_at) where status = 'active';

create table if not exists public.crm_outbound_events (
  id uuid primary key default gen_random_uuid(),
  outbound_message_id uuid references public.crm_outbound_messages(id) on delete set null,
  enrollment_id uuid references public.crm_sequence_enrollments(id) on delete set null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- updated_at triggers (best-effort)
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'kce_set_updated_at') then
    create or replace function public.kce_set_updated_at()
    returns trigger language plpgsql as $fn$
    begin
      new.updated_at = now();
      return new;
    end $fn$;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_seq_updated_at') then
    create trigger trg_seq_updated_at before update on public.crm_sequences
    for each row execute function public.kce_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_seq_steps_updated_at') then
    create trigger trg_seq_steps_updated_at before update on public.crm_sequence_steps
    for each row execute function public.kce_set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_seq_enroll_updated_at') then
    create trigger trg_seq_enroll_updated_at before update on public.crm_sequence_enrollments
    for each row execute function public.kce_set_updated_at();
  end if;
end $$;
