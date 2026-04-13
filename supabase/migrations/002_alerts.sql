-- Alert rules
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  instance_id uuid references n8n_instances(id) on delete cascade,
  workflow_id text,
  name text not null,
  channel text not null check (channel in ('email', 'slack', 'webhook')),
  destination text not null,
  threshold_count int not null default 1,
  threshold_minutes int not null default 5,
  cooldown_minutes int not null default 60,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists alerts_org_id_idx on alerts (org_id);
