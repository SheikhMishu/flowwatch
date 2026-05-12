-- Analytics RPCs for the upgraded analytics page.
-- Adds avg_duration_ms to daily aggregates, plus two new RPCs:
-- get_workflow_performance_stats and get_error_message_breakdown.

-- ── 1. Update daily aggregates to include avg_duration_ms ──────────────────────
drop function if exists get_daily_execution_aggregates(text, timestamptz, text);

create or replace function get_daily_execution_aggregates(
  p_org_id      text,
  p_since       timestamptz,
  p_instance_id text default null
)
returns table (
  date            date,
  total           bigint,
  failures        bigint,
  avg_duration_ms numeric
)
language sql
stable
security definer
as $$
  select
    (started_at at time zone 'UTC')::date                    as date,
    count(*)                                                  as total,
    count(*) filter (where status in ('error', 'crashed'))    as failures,
    avg(duration_ms) filter (where duration_ms is not null)   as avg_duration_ms
  from synced_executions
  where org_id = p_org_id::uuid
    and started_at >= p_since
    and (p_instance_id is null or instance_id = p_instance_id::uuid)
  group by 1
  order by 1;
$$;

-- ── 2. Workflow performance stats ──────────────────────────────────────────────
-- Returns per-workflow aggregates for the performance table and duration chart.
create or replace function get_workflow_performance_stats(
  p_org_id      text,
  p_since       timestamptz,
  p_instance_id text default null
)
returns table (
  workflow_name   text,
  total           bigint,
  failures        bigint,
  avg_duration_ms numeric,
  last_run_at     timestamptz
)
language sql
stable
security definer
as $$
  select
    workflow_name,
    count(*)                                                   as total,
    count(*) filter (where status in ('error', 'crashed'))     as failures,
    avg(duration_ms) filter (where duration_ms is not null)    as avg_duration_ms,
    max(started_at)                                            as last_run_at
  from synced_executions
  where org_id = p_org_id::uuid
    and started_at >= p_since
    and (p_instance_id is null or instance_id = p_instance_id::uuid)
  group by workflow_name
  order by total desc;
$$;

-- ── 3. Error message breakdown ────────────────────────────────────────────────
-- Returns top 10 error messages by frequency for the error breakdown card.
create or replace function get_error_message_breakdown(
  p_org_id      text,
  p_since       timestamptz,
  p_instance_id text default null
)
returns table (
  error_message text,
  count         bigint
)
language sql
stable
security definer
as $$
  select
    error_message,
    count(*) as count
  from synced_executions
  where org_id = p_org_id::uuid
    and started_at >= p_since
    and (p_instance_id is null or instance_id = p_instance_id::uuid)
    and status in ('error', 'crashed')
    and error_message is not null
    and error_message != ''
  group by error_message
  order by count desc
  limit 10;
$$;
