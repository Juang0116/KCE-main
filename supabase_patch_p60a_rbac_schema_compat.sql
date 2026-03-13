-- supabase_patch_p60a_rbac_schema_compat.sql
-- Goal: make RBAC tables compatible with both legacy (key) and new (role_key) naming.
-- Safe/idempotent: it will only add columns/indexes when missing.

begin;

-- 1) crm_roles: add role_key if missing, and backfill from key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='crm_roles' AND column_name='role_key'
  ) THEN
    ALTER TABLE public.crm_roles ADD COLUMN role_key text;
    UPDATE public.crm_roles SET role_key = key WHERE role_key IS NULL;
  END IF;
END $$;

-- Ensure role_key values
UPDATE public.crm_roles SET role_key = key WHERE role_key IS NULL;

-- Unique index on role_key (do not drop legacy PK)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='crm_roles_role_key_uniq'
  ) THEN
    CREATE UNIQUE INDEX crm_roles_role_key_uniq ON public.crm_roles(role_key);
  END IF;
END $$;

-- 2) crm_role_bindings: ensure role_key exists (already in most schemas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='crm_role_bindings' AND column_name='role_key'
  ) THEN
    ALTER TABLE public.crm_role_bindings ADD COLUMN role_key text;
  END IF;
END $$;

-- 3) View for Admin UI
DROP VIEW IF EXISTS public.crm_roles_expanded;
CREATE VIEW public.crm_roles_expanded AS
SELECT
  COALESCE(role_key, key) AS role_key,
  name,
  permissions,
  created_at
FROM public.crm_roles;

commit;
