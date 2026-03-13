-- supabase_patch_p46_ops_metrics.sql
-- P46: light indexing for SLA aggregation and ops dashboards.

create index if not exists ops_incidents_first_seen_idx on public.ops_incidents(first_seen_at);
create index if not exists ops_incidents_ack_idx on public.ops_incidents(acknowledged_at);
create index if not exists ops_incidents_resolved_idx on public.ops_incidents(resolved_at);

-- Optional (keep pauses tidy / faster queries)
create index if not exists crm_channel_pauses_channel_idx on public.crm_channel_pauses(channel);
