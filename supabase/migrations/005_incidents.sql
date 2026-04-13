-- Incidents table: auto-created when alerts fire, manually resolvable
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  instance_id uuid references n8n_instances(id) on delete set null,
  alert_id uuid references alerts(id) on delete set null,
  n8n_workflow_id text,
  workflow_name text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')) default 'high',
  status text not null check (status in ('open', 'investigating', 'resolved')) default 'open',
  title text not null,
  failure_count int not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  assigned_to uuid,
  created_at timestamptz not null default now()
);

create index if not exists incidents_org_idx on incidents (org_id, last_seen_at desc);
create index if not exists incidents_status_idx on incidents (org_id, status);
