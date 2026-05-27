-- Migration 033: Cron sync run history
-- Records one row per instance per cron batch so the admin can see what ran, when,
-- which orgs synced, how many rows were upserted, and any errors.

create table if not exists cron_sync_runs (
  id              uuid primary key default gen_random_uuid(),
  batch_id        uuid        not null,          -- all instances in one cron fire share this
  run_at          timestamptz not null default now(),
  triggered_by    text        not null default 'cron', -- 'cron' | 'manual'
  instance_id     uuid        references n8n_instances(id) on delete set null,
  org_id          uuid        references organizations(id) on delete set null,
  ok              boolean     not null,
  workflows_upserted  integer not null default 0,
  executions_upserted integer not null default 0,
  error_message   text,
  duration_ms     integer
);

create index if not exists idx_cron_sync_runs_run_at    on cron_sync_runs(run_at desc);
create index if not exists idx_cron_sync_runs_batch_id  on cron_sync_runs(batch_id);
create index if not exists idx_cron_sync_runs_org_id    on cron_sync_runs(org_id);
create index if not exists idx_cron_sync_runs_instance  on cron_sync_runs(instance_id);

-- ─── RPCs ────────────────────────────────────────────────────────────────────

-- Per-instance status: current state of every instance + most recent run stats.
-- Used for the "Instance Status" table on the admin cron page.
create or replace function admin_cron_instance_status()
returns table(
  instance_id             uuid,
  org_id                  uuid,
  org_name                text,
  instance_name           text,
  instance_url            text,
  is_active               boolean,
  last_synced_at          timestamptz,
  last_run_ok             boolean,
  last_workflows_upserted integer,
  last_executions_upserted integer,
  last_error_message      text,
  last_run_at             timestamptz,
  last_triggered_by       text,
  last_duration_ms        integer
)
language sql stable security definer as $$
  select
    i.id              as instance_id,
    i.org_id,
    o.name            as org_name,
    i.name            as instance_name,
    i.url             as instance_url,
    i.is_active,
    i.last_synced_at,
    r.ok              as last_run_ok,
    r.workflows_upserted  as last_workflows_upserted,
    r.executions_upserted as last_executions_upserted,
    r.error_message   as last_error_message,
    r.run_at          as last_run_at,
    r.triggered_by    as last_triggered_by,
    r.duration_ms     as last_duration_ms
  from n8n_instances i
  left join organizations o on o.id = i.org_id
  left join lateral (
    select ok, workflows_upserted, executions_upserted, error_message,
           run_at, triggered_by, duration_ms
    from cron_sync_runs
    where instance_id = i.id
    order by run_at desc
    limit 1
  ) r on true
  order by i.is_active desc, o.name, i.name;
$$;

-- Batch summary: one row per batch_id, ordered most recent first.
-- Used for the "Sync History" table on the admin cron page.
create or replace function admin_cron_recent_batches(p_limit int default 20)
returns table(
  batch_id            uuid,
  run_at              timestamptz,
  triggered_by        text,
  total_instances     bigint,
  succeeded           bigint,
  failed              bigint,
  total_workflows     bigint,
  total_executions    bigint,
  avg_duration_ms     numeric
)
language sql stable security definer as $$
  select
    batch_id,
    min(run_at)                                   as run_at,
    max(triggered_by)                             as triggered_by,
    count(*)                                      as total_instances,
    count(*) filter (where ok)                    as succeeded,
    count(*) filter (where not ok)                as failed,
    coalesce(sum(workflows_upserted),0)::bigint   as total_workflows,
    coalesce(sum(executions_upserted),0)::bigint  as total_executions,
    round(avg(duration_ms))                       as avg_duration_ms
  from cron_sync_runs
  group by batch_id
  order by min(run_at) desc
  limit p_limit;
$$;
