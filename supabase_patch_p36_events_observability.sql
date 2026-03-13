-- supabase_patch_p36_events_observability.sql
-- P36: Observability columns + indexes for public.events
--
-- Why:
-- - The codebase logs structured events with optional: source, entity_id, dedupe_key.
-- - Admin screens query events by entity_id for an event timeline.
--
-- Safe to run multiple times.

begin;

alter table if exists public.events
  add column if not exists source text,
  add column if not exists entity_id text,
  add column if not exists dedupe_key text;

create index if not exists idx_events_source      on public.events(source);
create index if not exists idx_events_entity_id   on public.events(entity_id);
create index if not exists idx_events_dedupe_key  on public.events(dedupe_key);

-- Optional dedupe support (best-effort): allows the app to write a dedupe_key without duplicating the same event.
-- Inserts that violate this index will error, but the logger swallows errors by design.
create unique index if not exists events_type_dedupe_key_uniq
  on public.events(type, dedupe_key)
  where dedupe_key is not null;

commit;
