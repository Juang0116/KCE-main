-- P42: Audit/Telemetry indexes (optional but recommended)
-- Safe to run multiple times.

-- Admin audit events
CREATE INDEX IF NOT EXISTS admin_audit_events_created_at_idx
  ON public.admin_audit_events (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_events_action_created_at_idx
  ON public.admin_audit_events (action, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_events_actor_created_at_idx
  ON public.admin_audit_events (actor, created_at DESC);

-- Security events
CREATE INDEX IF NOT EXISTS security_events_created_at_idx
  ON public.security_events (created_at DESC);

CREATE INDEX IF NOT EXISTS security_events_kind_created_at_idx
  ON public.security_events (kind, created_at DESC);

CREATE INDEX IF NOT EXISTS security_events_actor_created_at_idx
  ON public.security_events (actor, created_at DESC);
