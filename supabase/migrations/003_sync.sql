-- Workflow snapshots (latest known state of each workflow per instance)
create table if not exists workflow_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  instance_id uuid references n8n_instances(id) on delete cascade not null,
  n8n_workflow_id text not null,
  name text not null,
  is_active boolean not null default false,
  node_count integer not null default 0,
  tags text[] not null default '{}',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(instance_id, n8n_workflow_id)
);

create index if not exists workflow_snapshots_org_idx on workflow_snapshots (org_id);
create index if not exists workflow_snapshots_instance_idx on workflow_snapshots (instance_id);

-- Synced executions (historical execution log from n8n)
create table if not exists synced_executions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  instance_id uuid references n8n_instances(id) on delete cascade not null,
  n8n_execution_id text not null,
  n8n_workflow_id text not null,
  workflow_name text not null,
  status text not null,
  mode text not null default 'trigger',
  started_at timestamptz not null,
  finished_at timestamptz,
  duration_ms integer,
  failed_node text,
  error_message text,
  error_type text,
  created_at timestamptz not null default now(),
  unique(instance_id, n8n_execution_id)
);

create index if not exists synced_executions_org_started_idx on synced_executions (org_id, started_at desc);
create index if not exists synced_executions_instance_started_idx on synced_executions (instance_id, started_at desc);
create index if not exists synced_executions_workflow_idx on synced_executions (instance_id, n8n_workflow_id, started_at desc);
