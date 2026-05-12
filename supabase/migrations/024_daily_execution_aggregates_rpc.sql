-- RPC: daily execution aggregates for the analytics 7-day trend chart.
-- Returns one row per UTC day in the requested window, always covering the full
-- range regardless of execution volume (no PostgREST row-limit issues).

create or replace function get_daily_execution_aggregates(
  p_org_id     text,
  p_since      timestamptz,
  p_instance_id text default null
)
returns table (
  date      date,
  total     bigint,
  failures  bigint
)
language sql
stable
security definer
as $$
  select
    (started_at at time zone 'UTC')::date as date,
    count(*)                               as total,
    count(*) filter (where status in ('error', 'crashed')) as failures
  from synced_executions
  where org_id = p_org_id::uuid
    and started_at >= p_since
    and (p_instance_id is null or instance_id = p_instance_id::uuid)
  group by 1
  order by 1;
$$;
