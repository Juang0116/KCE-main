-- supabase_patch_p51_conversion_hardening.sql
-- P16: Conversion hardening
-- - Cohort follow-ups (D+1 / D+3) with idempotent locks
-- - Checkout "opened" tracking (redirect link)
-- - Optional incentive ledger (capped by day)
-- Safe to run multiple times.

begin;

-- 1) Deal conversion timestamps
alter table public.deals
  add column if not exists checkout_started_at timestamptz null;

alter table public.deals
  add column if not exists checkout_opened_at timestamptz null;

create index if not exists deals_checkout_started_idx
  on public.deals (checkout_started_at desc);

create index if not exists deals_checkout_opened_idx
  on public.deals (checkout_opened_at desc);

-- 2) Idempotent follow-up locks (per deal + cohort week)
create table if not exists public.crm_followup_locks (
  id bigserial primary key,
  deal_id uuid not null references public.deals(id) on delete cascade,
  cohort text not null,
  kind text not null check (kind in ('checkout_d1','checkout_d3')),
  created_at timestamptz not null default now(),
  sent_message_id uuid null references public.crm_outbound_messages(id) on delete set null
);

create unique index if not exists crm_followup_locks_unique
  on public.crm_followup_locks (deal_id, cohort, kind);

create index if not exists crm_followup_locks_created
  on public.crm_followup_locks (created_at desc);

-- 3) Optional incentive ledger (one per deal+cohort+kind)
create table if not exists public.crm_incentives (
  id bigserial primary key,
  deal_id uuid not null references public.deals(id) on delete cascade,
  cohort text not null,
  kind text not null default 'checkout',
  incentive text not null,
  expires_at timestamptz null,
  created_at timestamptz not null default now()
);

create unique index if not exists crm_incentives_unique
  on public.crm_incentives (deal_id, cohort, kind);

create index if not exists crm_incentives_created
  on public.crm_incentives (created_at desc);

-- 4) Seed safe default templates (A/B) for cohort follow-ups.
-- Channel: 'any' so it works for WhatsApp + Email.
-- These are defaults; feel free to edit in /admin/templates.

insert into public.crm_templates (key, locale, channel, variant, weight, subject, body, enabled)
values
  -- ES
  ('deal.followup.checkout_d1','es','any','A',3,'Recordatorio: tu reserva — {tour}',
    'Hola {name} 🙌 Solo para confirmar: ¿pudiste abrir el link para {tour}?\n\n{checkout_url}\n\n{incentive_line}',true),
  ('deal.followup.checkout_d1','es','any','B',2,'¿Te ayudo a confirmar {tour}?',
    'Hola {name} 👋 ¿Te quedó alguna duda para confirmar {tour}? Te dejo el link aquí: {checkout_url}\n\n{incentive_line}',true),
  ('deal.followup.checkout_d3','es','any','A',3,'Último paso: confirmar {tour}',
    'Hola {name} 👋 Si todavía te interesa {tour}, puedo ajustar fecha/personas y enviarte un link actualizado.\n\nPor ahora, aquí está el link: {checkout_url}\n\n{incentive_line}',true),
  ('deal.followup.checkout_d3','es','any','B',2,'¿Seguimos con {tour}?',
    'Hola {name} 🙌 ¿Confirmamos {tour}? Si quieres, te acompaño paso a paso. Link: {checkout_url}\n\n{incentive_line}',true),

  -- EN
  ('deal.followup.checkout_d1','en','any','A',3,'Reminder: your booking — {tour}',
    'Hi {name} 🙌 Just checking: were you able to open the link for {tour}?\n\n{checkout_url}\n\n{incentive_line}',true),
  ('deal.followup.checkout_d1','en','any','B',2,'Need help confirming {tour}?',
    'Hi {name} 👋 Any questions before confirming {tour}? Here is the link again: {checkout_url}\n\n{incentive_line}',true),
  ('deal.followup.checkout_d3','en','any','A',3,'Last step: confirm {tour}',
    'Hi {name} 👋 If you still want {tour}, we can adjust date/people and I can send an updated link.\n\nFor now, here is the link: {checkout_url}\n\n{incentive_line}',true),
  ('deal.followup.checkout_d3','en','any','B',2,'Shall we continue with {tour}?',
    'Hi {name} 🙌 Shall we confirm {tour}? I can guide you step by step. Link: {checkout_url}\n\n{incentive_line}',true),

  -- DE
  ('deal.followup.checkout_d1','de','any','A',3,'Erinnerung: deine Buchung — {tour}',
    'Hallo {name} 🙌 Konntest du den Link für {tour} öffnen?\n\n{checkout_url}\n\n{incentive_line}',true),
  ('deal.followup.checkout_d1','de','any','B',2,'Brauchst du Hilfe für {tour}?',
    'Hallo {name} 👋 Gibt es noch Fragen, bevor wir {tour} bestätigen? Hier ist der Link: {checkout_url}\n\n{incentive_line}',true),
  ('deal.followup.checkout_d3','de','any','A',3,'Letzter Schritt: {tour} bestätigen',
    'Hallo {name} 👋 Wenn du noch Interesse an {tour} hast, können wir Datum/Personen anpassen und ich sende einen aktualisierten Link.\n\nHier ist der Link: {checkout_url}\n\n{incentive_line}',true),
  ('deal.followup.checkout_d3','de','any','B',2,'Sollen wir mit {tour} weitermachen?',
    'Hallo {name} 🙌 Sollen wir {tour} bestätigen? Ich begleite dich Schritt für Schritt. Link: {checkout_url}\n\n{incentive_line}',true)

on conflict (key, locale, channel, variant) do nothing;

commit;
