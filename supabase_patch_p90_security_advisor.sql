-- supabase_patch_p90_security_advisor.sql
-- Goal: Fix Supabase Security Advisor findings (RLS disabled tables, overly-permissive policies,
--       mutable search_path functions, and security-definer view).
-- Safe/idempotent. Apply in Supabase SQL Editor.

begin;

-- 0) Harden trigger/search helper functions (avoid mutable search_path)
-- NOTE: If a function does not exist, the ALTER will error; we guard with DO blocks.
DO $$
BEGIN
  IF to_regprocedure('public.set_updated_at()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog, public';
  END IF;
EXCEPTION WHEN undefined_function THEN
  -- ignore
END$$;

DO $$
BEGIN
  IF to_regprocedure('public.set_updated_at_ops_postmortems()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.set_updated_at_ops_postmortems() SET search_path = pg_catalog, public';
  END IF;
EXCEPTION WHEN undefined_function THEN
  -- ignore
END$$;

DO $$
BEGIN
  IF to_regprocedure('public.tours_search_tsv_update()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.tours_search_tsv_update() SET search_path = pg_catalog, public';
  END IF;
EXCEPTION WHEN undefined_function THEN
  -- ignore
END$$;


-- 1) Make RBAC view security-invoker (prevents definer-rights behavior)
DO $$
BEGIN
  IF to_regclass('public.crm_roles_expanded') IS NOT NULL THEN
    BEGIN
      EXECUTE 'ALTER VIEW public.crm_roles_expanded SET (security_invoker = true)';
    EXCEPTION WHEN others THEN
      -- Fallback: recreate as security-invoker view (PG15+)
      EXECUTE 'DROP VIEW IF EXISTS public.crm_roles_expanded';
      EXECUTE $$
        CREATE VIEW public.crm_roles_expanded
        WITH (security_invoker = true)
        AS
        SELECT
          COALESCE(role_key, key) AS role_key,
          name,
          permissions,
          created_at
        FROM public.crm_roles;
      $$;
    END;

    -- Defense-in-depth: do not expose RBAC internals via PostgREST
    EXECUTE 'REVOKE ALL ON TABLE public.crm_roles FROM anon, authenticated';
    EXECUTE 'REVOKE ALL ON TABLE public.crm_role_bindings FROM anon, authenticated';
  END IF;
END$$;


-- 2) Enable RLS on internal tables that live in exposed schemas (public)
-- Strategy: enable RLS + revoke anon/auth privileges. Service role (supabaseAdmin) still works.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    -- Ops / SRE
    'ops_dr_drills',
    'ops_incidents',
    'ops_incident_updates',
    'ops_postmortems',
    'ops_retention_runs',

    -- CRM / Admin internals
    'crm_permissions_catalog',
    'crm_runtime_flags',
    'crm_breakglass_requests',
    'crm_channel_pauses',
    'crm_template_winner_locks',
    'crm_alerts',
    'crm_mitigation_actions',
    'crm_audit_log',
    'crm_ops_approvals',
    'crm_alert_rules',
    'crm_sequences',
    'crm_sequence_steps',
    'crm_sequence_enrollments',
    'crm_followup_locks',
    'crm_incentives',

    -- AI / Analytics internals
    'ai_runs',
    'analytics_customer_cohorts',

    -- Catalog internals
    'tour_pricing_rules',
    'catalog_collections',
    'catalog_collection_items',

    -- Consent
    'consent_events',
    'user_consents',

    -- Security/audit
    'admin_audit_events',
    'action_nonces',

    -- FX
    'fx_rates_daily'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      -- Optional but recommended: force owners too (prevents accidental bypass)
      -- EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);

      -- Keep these tables internal (no PostgREST access for anon/auth)
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END$$;


-- 3) Replace overly-permissive RLS policies ("USING true" / "WITH CHECK true")
-- Public ingestion tables: allow INSERT only. No SELECT/UPDATE/DELETE for anon/auth.
DO $$
DECLARE
  pol text;
BEGIN
  -- affiliate_clicks
  IF to_regclass('public.affiliate_clicks') IS NOT NULL THEN
    -- Drop all existing policies (names vary)
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_clicks'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.affiliate_clicks', pol);
    END LOOP;

    EXECUTE 'ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON TABLE public.affiliate_clicks FROM anon, authenticated';
    EXECUTE 'GRANT INSERT ON TABLE public.affiliate_clicks TO anon, authenticated';

    EXECUTE $$
      CREATE POLICY affiliate_clicks_insert
      ON public.affiliate_clicks
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
    $$;
  END IF;

  -- privacy_requests
  IF to_regclass('public.privacy_requests') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='privacy_requests'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.privacy_requests', pol);
    END LOOP;

    EXECUTE 'ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON TABLE public.privacy_requests FROM anon, authenticated';
    EXECUTE 'GRANT INSERT ON TABLE public.privacy_requests TO anon, authenticated';

    EXECUTE $$
      CREATE POLICY privacy_requests_insert
      ON public.privacy_requests
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
    $$;
  END IF;

  -- web_vitals
  IF to_regclass('public.web_vitals') IS NOT NULL THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='web_vitals'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.web_vitals', pol);
    END LOOP;

    EXECUTE 'ALTER TABLE public.web_vitals ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON TABLE public.web_vitals FROM anon, authenticated';
    EXECUTE 'GRANT INSERT ON TABLE public.web_vitals TO anon, authenticated';

    EXECUTE $$
      CREATE POLICY web_vitals_insert
      ON public.web_vitals
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
    $$;
  END IF;
END$$;

commit;

-- Notes:
-- - After applying, Supabase Security Advisor "RLS Disabled in Public" should drop.
-- - Some items may move to "Info" (RLS enabled but no policies) for internal tables. That's OK.
-- - Enable "Leaked password protection" in Supabase Auth settings (dashboard) manually.
