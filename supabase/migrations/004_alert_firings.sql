-- Track when each alert last fired (for cooldown enforcement)
alter table alerts add column if not exists last_fired_at timestamptz;

-- Log of every alert firing (for history / audit)
create table if not exists alert_firings (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references alerts(id) on delete cascade not null,
  org_id uuid references organizations(id) on delete cascade not null,
  fired_at timestamptz not null default now(),
  failure_count int not null,
  workflow_names text[] not null default '{}'
);

create index if not exists alert_firings_alert_idx on alert_firings (alert_id, fired_at desc);
create index if not exists alert_firings_org_idx on alert_firings (org_id, fired_at desc);
