-- supabase_patch_p90_security_advisor_v2.sql
-- Purpose: Reduce Supabase Security Advisor findings safely for KCE
-- Strategy:
--  - Internal tables: ENABLE RLS + REVOKE all from anon/authenticated/PUBLIC (backend uses service_role)
--  - Public ingest tables: INSERT-only for anon/authenticated (no SELECT/UPDATE/DELETE)
--  - Fix mutable search_path on functions (best-effort)
--  - Set crm_roles_expanded as security_invoker (best-effort)

BEGIN;

-- ---------- Helper: drop ALL policies on a given public table ----------
-- Uses DO blocks with a unique dollar tag to avoid nesting issues.
DO $drop_policies$
DECLARE r record;
BEGIN
  -- affiliate_clicks
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_clicks' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, 'affiliate_clicks');
  END LOOP;

  -- privacy_requests
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='privacy_requests' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, 'privacy_requests');
  END LOOP;

  -- web_vitals
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='web_vitals' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, 'web_vitals');
  END LOOP;
END
$drop_policies$;

-- ---------- PUBLIC INGEST TABLES (INSERT-ONLY) ----------
-- 1) affiliate_clicks
ALTER TABLE IF EXISTS public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.affiliate_clicks FROM PUBLIC;
REVOKE ALL ON TABLE public.affiliate_clicks FROM anon;
REVOKE ALL ON TABLE public.affiliate_clicks FROM authenticated;
GRANT INSERT ON TABLE public.affiliate_clicks TO anon;
GRANT INSERT ON TABLE public.affiliate_clicks TO authenticated;

CREATE POLICY affiliate_clicks_insert
  ON public.affiliate_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2) privacy_requests
ALTER TABLE IF EXISTS public.privacy_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.privacy_requests FROM PUBLIC;
REVOKE ALL ON TABLE public.privacy_requests FROM anon;
REVOKE ALL ON TABLE public.privacy_requests FROM authenticated;
GRANT INSERT ON TABLE public.privacy_requests TO anon;
GRANT INSERT ON TABLE public.privacy_requests TO authenticated;

CREATE POLICY privacy_requests_insert
  ON public.privacy_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3) web_vitals
ALTER TABLE IF EXISTS public.web_vitals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.web_vitals FROM PUBLIC;
REVOKE ALL ON TABLE public.web_vitals FROM anon;
REVOKE ALL ON TABLE public.web_vitals FROM authenticated;
GRANT INSERT ON TABLE public.web_vitals TO anon;
GRANT INSERT ON TABLE public.web_vitals TO authenticated;

CREATE POLICY web_vitals_insert
  ON public.web_vitals
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ---------- INTERNAL / ADMIN TABLES: enable RLS + revoke public access ----------
-- NOTE: service_role bypasses RLS; your backend/admin endpoints use service-role.
-- If you ever need client-side read/write, create explicit policies instead.

-- Ops / incidents
ALTER TABLE IF EXISTS public.ops_incidents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ops_incidents FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.ops_incident_updates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ops_incident_updates FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.ops_postmortems ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ops_postmortems FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.ops_dr_drills ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ops_dr_drills FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.ops_retention_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ops_retention_runs FROM PUBLIC, anon, authenticated;

-- CRM / admin audit
ALTER TABLE IF EXISTS public.crm_permissions_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_permissions_catalog FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.crm_runtime_flags ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_runtime_flags FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.crm_breakglass_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_breakglass_requests FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.crm_channel_pauses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_channel_pauses FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.crm_template_winner_locks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_template_winner_locks FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.crm_alerts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_alerts FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.crm_alert_rules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_alert_rules FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.crm_mitigation_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_mitigation_actions FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.crm_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_audit_log FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.crm_ops_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_ops_approvals FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.admin_audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_audit_events FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.action_nonces ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.action_nonces FROM PUBLIC, anon, authenticated;

-- CRM sequences (commercial autopilot)
ALTER TABLE IF EXISTS public.crm_sequences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_sequences FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.crm_sequence_steps ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_sequence_steps FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.crm_sequence_enrollments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_sequence_enrollments FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.crm_followup_locks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_followup_locks FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.crm_incentives ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_incentives FROM PUBLIC, anon, authenticated;

-- Catalog / pricing internals
ALTER TABLE IF EXISTS public.tour_pricing_rules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.tour_pricing_rules FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.catalog_collections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.catalog_collections FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.catalog_collection_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.catalog_collection_items FROM PUBLIC, anon, authenticated;

-- Finance / analytics internals
ALTER TABLE IF EXISTS public.fx_rates_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.fx_rates_daily FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.analytics_customer_cohorts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.analytics_customer_cohorts FROM PUBLIC, anon, authenticated;

-- AI internal runs
ALTER TABLE IF EXISTS public.ai_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ai_runs FROM PUBLIC, anon, authenticated;

-- Consent / privacy internals
ALTER TABLE IF EXISTS public.consent_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.consent_events FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.user_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_consents FROM PUBLIC, anon, authenticated;

-- ---------- VIEW: security_invoker (best-effort, do not fail patch) ----------
DO $view_fix$
BEGIN
  -- Works on Postgres 15+: property supported as reloption.
  EXECUTE 'ALTER VIEW public.crm_roles_expanded SET (security_invoker=true)';
EXCEPTION
  WHEN undefined_table THEN
    -- view does not exist; ignore
    NULL;
  WHEN insufficient_privilege THEN
    NULL;
  WHEN others THEN
    -- If ALTER VIEW doesn't support security_invoker on this version, ignore.
    NULL;
END
$view_fix$;

-- ---------- FUNCTIONS: lock search_path (best-effort) ----------
DO $fn_fix$
BEGIN
  -- Common trigger functions in KCE schema (0-arg trigger functions)
  BEGIN
    EXECUTE 'ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog, public';
  EXCEPTION WHEN undefined_function THEN NULL; END;

  BEGIN
    EXECUTE 'ALTER FUNCTION public.set_updated_at_ops_postmortems() SET search_path = pg_catalog, public';
  EXCEPTION WHEN undefined_function THEN NULL; END;

  BEGIN
    EXECUTE 'ALTER FUNCTION public.tours_search_tsv_update() SET search_path = pg_catalog, public';
  EXCEPTION WHEN undefined_function THEN NULL; END;
END
$fn_fix$;

COMMIT;

-- NOTE (manual):
-- Supabase Dashboard → Authentication → Settings:
-- Enable "Leaked password protection" to clear that warning.
