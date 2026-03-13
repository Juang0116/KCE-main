-- supabase_patch_p44_deals_stages.sql
-- Goal: make deals.stage compatible with the Kanban board defaults.
-- Safe to run multiple times.

do $$
begin
  -- Drop a known constraint name if it exists.
  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'deals'
      and c.conname = 'deals_stage_check'
  ) then
    execute 'alter table public.deals drop constraint deals_stage_check';
  end if;
exception when undefined_table then
  -- deals table not present in this project; ignore.
  null;
end $$;

-- Add (or re-add) the constraint.
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'deals'
      and c.conname = 'deals_stage_check'
  ) then
    execute $$
      alter table public.deals
      add constraint deals_stage_check
      check (stage = any (array['new','contacted','qualified','proposal','checkout','won','lost']))
    $$;
  end if;
exception when undefined_table then
  null;
end $$;

-- Notes:
-- If you have an older custom CHECK constraint with another name, you may need to drop it manually.
-- In that case, run: \d public.deals (in SQL editor) and drop the stage check constraint by name.
