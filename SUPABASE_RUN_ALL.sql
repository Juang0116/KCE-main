-- ============================================================
-- KCE — MASTER MIGRATION RUNNER
-- Run this in your Supabase SQL Editor IN ORDER
-- Each section is idempotent where possible
-- ============================================================

-- STEP 1: Base schema (run first if fresh DB)
-- \i supabase_schema.sql

-- STEP 2: Core patches (P3-P12)
-- \i supabase_patch_p3.sql
-- \i supabase_patch_p12_deals_checkout_url.sql

-- STEP 3: Tickets system
-- \i supabase_patch_p33_tickets.sql
-- \i supabase_patch_p34_tickets_constraints.sql
-- \i supabase_patch_p35_tickets_active_index.sql
-- \i supabase_patch_tickets_full.sql

-- STEP 4: Events & observability
-- \i supabase_patch_p36_events_observability.sql
-- \i supabase_patch_p36_signed_actions.sql
-- \i supabase_patch_p38_signed_actions.sql

-- STEP 5: Auth & Security
-- \i supabase_patch_event_locks_scope.sql
-- \i supabase_patch_p86_security_events_hardening.sql
-- \i supabase_patch_p96_security_fixes.sql

-- STEP 6: CRM & Growth
-- \i supabase_patch_p81_affiliates.sql
-- \i supabase_patch_p82_gotomarket_launches.sql
-- \i supabase_patch_p83_privacy_requests.sql
-- \i supabase_patch_p84_backups_log.sql
-- \i supabase_patch_p85_web_vitals.sql

-- STEP 7: Security hardening
-- \i supabase_patch_p90_dr_drills.sql
-- \i supabase_patch_p90_security_advisor.sql
-- \i supabase_patch_p90_security_advisor_v2.sql

-- STEP 8: Content & Ops views
-- \i supabase_patch_p94_ops_views.sql

-- STEP 9: Seeds (data inicial)
-- \i supabase_seed.sql
-- \i supabase_patch_p91_followup_sequences_seed.sql
-- \i supabase_patch_p92_blog_first_post.sql
-- \i supabase_patch_p93_tours_seed.sql
-- \i supabase_patch_p95_discover_seed.sql
-- \i supabase_seed_kce_official_tours.sql
-- \i supabase_seed_p46_crm_templates.sql

-- STEP 10: Fase 3 & 4 full migrations
-- \i supabase_migrations_fase3_fase4.sql

-- NOTE: Uncomment and run each \i line individually in Supabase SQL Editor
-- OR paste the content of each file directly.
SELECT 'KCE Master Migration Reference - See SUPABASE_RUN_ALL.sql for order' as info;
