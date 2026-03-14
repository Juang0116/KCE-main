-- supabase_patch_p94_ops_views.sql
-- Utility views for the Ops Dashboard. Safe to run multiple times.

-- 1. Today's agent activity summary
create or replace view public.v_agent_activity_today as
select
  source as agent,
  type as event_type,
  count(*) as count,
  max(created_at) as last_at
from public.events
where source in ('ops_agent', 'review_agent')
  and created_at >= current_date
group by source, type
order by source, type;

-- 2. Outbound messages by agent (last 7 days)
create or replace view public.v_agent_outbound_7d as
select
  metadata->>'agent' as agent,
  status,
  count(*) as count,
  max(created_at) as last_at
from public.crm_outbound_messages
where metadata->>'agent' in ('ops_agent', 'review_agent')
  and created_at >= now() - interval '7 days'
group by metadata->>'agent', status
order by agent, status;

-- 3. Active followup sequences summary
create or replace view public.v_followup_sequences_summary as
select
  cs.key,
  cs.name,
  cs.status,
  count(ce.id) filter (where ce.status = 'active') as active_enrollments,
  count(ce.id) filter (where ce.status = 'completed') as completed,
  count(ce.id) filter (where ce.status = 'failed') as failed,
  count(ce.id) filter (where ce.status = 'canceled') as canceled
from public.crm_sequences cs
left join public.crm_sequence_enrollments ce on ce.sequence_id = cs.id
group by cs.id, cs.key, cs.name, cs.status;
