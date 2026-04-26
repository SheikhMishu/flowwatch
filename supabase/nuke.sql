-- ─────────────────────────────────────────────────────────────────────────────
-- NUKE.SQL  — wipe all application data for a clean end-to-end test run
-- Run in Supabase SQL Editor using the service role (bypasses RLS).
--
-- WHAT IT DOES:  TRUNCATE all 18 app tables, restart sequences, cascade FKs.
-- WHAT IT DOES NOT:  drop tables, remove extensions, touch auth.users,
--                    or change schema structure in any way.
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE TABLE
  -- ── leaf tables: no other table has an FK pointing to these ─────────────────
  alert_firings,        -- refs alerts + organizations  (both CASCADE)
  activity_logs,        -- refs organizations            (CASCADE)
  app_logs,             -- refs organizations            (SET NULL → must be explicit)
  ai_usage,             -- ⚠ NO FK constraint on org_id — cascade won't touch this
  incidents,            -- refs organizations, n8n_instances, alerts
  synced_executions,    -- refs organizations, n8n_instances
  workflow_snapshots,   -- refs organizations, n8n_instances
  executions,           -- refs n8n_instances (CASCADE), workflows (SET NULL)
  workflows,            -- refs n8n_instances            (CASCADE)

  -- ── mid-level: depend on n8n_instances / organizations ──────────────────────
  alerts,               -- refs organizations + n8n_instances  (both CASCADE)
  n8n_instances,        -- refs organizations                   (CASCADE)
  organization_invites, -- refs organizations                   (CASCADE)
  organization_members, -- refs organizations + users           (both CASCADE)

  -- ── root tables ──────────────────────────────────────────────────────────────
  organizations,
  users,

  -- ── standalone tables (no FK relationships) ──────────────────────────────────
  pin_verifications,
  page_visits,
  signups

RESTART IDENTITY    -- reset any sequences (safe even if no sequences exist)
CASCADE;            -- let Postgres handle any remaining FK references automatically

-- Verify all tables are empty after the wipe
SELECT
  relname   AS table_name,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE relname IN (
  'alert_firings','activity_logs','app_logs','ai_usage',
  'incidents','synced_executions','workflow_snapshots',
  'executions','workflows','alerts','n8n_instances',
  'organization_invites','organization_members',
  'organizations','users',
  'pin_verifications','page_visits','signups'
)
ORDER BY relname;
