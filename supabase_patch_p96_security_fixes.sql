-- supabase_patch_p96_security_fixes.sql
-- Fixes the 4 errors + warnings from Supabase Security Advisor.
-- Safe to run multiple times.

-- ─────────────────────────────────────────────────────────
-- ERROR 1-3: Recreate the 3 ops views with SECURITY INVOKER
-- (removes the SECURITY DEFINER default)
-- ─────────────────────────────────────────────────────────

drop view if exists public.v_agent_activity_today;
create view public.v_agent_activity_today
  with (security_invoker = true)
as
select
  source as agent,
  type   as event_type,
  count(*)         as count,
  max(created_at)  as last_at
from public.events
where source in ('ops_agent', 'review_agent')
  and created_at >= current_date
group by source, type
order by source, type;

drop view if exists public.v_agent_outbound_7d;
create view public.v_agent_outbound_7d
  with (security_invoker = true)
as
select
  metadata->>'agent' as agent,
  status,
  count(*)           as count,
  max(created_at)    as last_at
from public.crm_outbound_messages
where metadata->>'agent' in ('ops_agent', 'review_agent')
  and created_at >= now() - interval '7 days'
group by metadata->>'agent', status
order by agent, status;

drop view if exists public.v_followup_sequences_summary;
create view public.v_followup_sequences_summary
  with (security_invoker = true)
as
select
  cs.key,
  cs.name,
  cs.status,
  count(ce.id) filter (where ce.status = 'active')    as active_enrollments,
  count(ce.id) filter (where ce.status = 'completed') as completed,
  count(ce.id) filter (where ce.status = 'failed')    as failed,
  count(ce.id) filter (where ce.status = 'canceled')  as canceled
from public.crm_sequences cs
left join public.crm_sequence_enrollments ce on ce.sequence_id = cs.id
group by cs.id, cs.key, cs.name, cs.status;

-- ─────────────────────────────────────────────────────────
-- ERROR 4: Enable RLS on crm_outbound_events
-- ─────────────────────────────────────────────────────────
alter table if exists public.crm_outbound_events enable row level security;

-- Allow service role full access (server-side only)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'crm_outbound_events' and policyname = 'service_role_all'
  ) then
    execute 'create policy service_role_all on public.crm_outbound_events
      for all to service_role using (true) with check (true)';
  end if;
end $$;

-- ─────────────────────────────────────────────────────────
-- WARNING: Fix tours_search_tsv_update function search_path
-- ─────────────────────────────────────────────────────────
do $$ begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'tours_search_tsv_update'
  ) then
    execute $f$
      alter function public.tours_search_tsv_update()
        set search_path = public
    $f$;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────
-- WARNING: Tighten RLS policies on affiliate_clicks,
--          privacy_requests, web_vitals (WITH CHECK (true) → service_role only)
-- ─────────────────────────────────────────────────────────
-- These tables only need server-side writes, not anon inserts.
-- Drop the always-true policies and replace with service_role only.

do $$ 
declare
  t text;
begin
  foreach t in array array['affiliate_clicks','privacy_requests','web_vitals']
  loop
    -- Drop existing overly-permissive policies
    execute format('
      do $inner$
      declare r record;
      begin
        for r in (select policyname from pg_policies where tablename = %L and schemaname = ''public'')
        loop
          execute format(''drop policy if exists %%I on public.%I'', r.policyname, %L);
        end loop;
      end $inner$;
    ', t, t, t);
    -- Add proper service_role policy
    execute format('
      create policy service_role_all on public.%I
        for all to service_role using (true) with check (true)
    ', t);
  end loop;
end $$;
