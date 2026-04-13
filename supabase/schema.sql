-- FlowWatch Database Schema
-- Run this in your Supabase SQL editor

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Users ────────────────────────────────────────────────────────────────────
create table public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  name          text not null,
  password_hash text not null,
  avatar_url    text,
  plan          text not null default 'free' check (plan in ('free', 'pro', 'team', 'enterprise')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── n8n Instances ────────────────────────────────────────────────────────────
create table public.n8n_instances (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  name            text not null,
  url             text not null,
  -- Store encrypted API key — only last 4 chars exposed to frontend
  api_key_enc     text not null,
  api_key_hint    text not null,
  is_active       boolean not null default true,
  last_synced_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_instances_user_id on public.n8n_instances(user_id);

-- ─── Workflows ────────────────────────────────────────────────────────────────
create table public.workflows (
  id                      uuid primary key default gen_random_uuid(),
  instance_id             uuid not null references public.n8n_instances(id) on delete cascade,
  n8n_id                  text not null,
  name                    text not null,
  status                  text not null default 'inactive' check (status in ('active', 'inactive')),
  tags                    text[] not null default '{}',
  node_count              int not null default 0,
  last_execution_at       timestamptz,
  last_execution_status   text check (last_execution_status in ('success', 'error', 'running', 'waiting', 'canceled')),
  executions_24h          int not null default 0,
  failures_24h            int not null default 0,
  success_rate            numeric(5,2) not null default 100,
  avg_duration_ms         int not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique(instance_id, n8n_id)
);

create index idx_workflows_instance_id on public.workflows(instance_id);
create index idx_workflows_status on public.workflows(status);

-- ─── Executions ───────────────────────────────────────────────────────────────
create table public.executions (
  id                  uuid primary key default gen_random_uuid(),
  instance_id         uuid not null references public.n8n_instances(id) on delete cascade,
  workflow_id         uuid references public.workflows(id) on delete set null,
  workflow_name       text not null,
  n8n_execution_id    text not null,
  status              text not null check (status in ('success', 'error', 'running', 'waiting', 'canceled')),
  started_at          timestamptz not null,
  finished_at         timestamptz,
  duration_ms         int,
  failed_node         text,
  error_message       text,
  error_type          text,
  mode                text check (mode in ('manual', 'trigger', 'webhook', 'retry')),
  -- Raw execution data (optional, disable to save storage)
  data                jsonb,
  created_at          timestamptz not null default now()
);

create index idx_executions_instance_id on public.executions(instance_id);
create index idx_executions_workflow_id on public.executions(workflow_id);
create index idx_executions_status on public.executions(status);
create index idx_executions_started_at on public.executions(started_at desc);

-- ─── Incidents ────────────────────────────────────────────────────────────────
create table public.incidents (
  id              uuid primary key default gen_random_uuid(),
  instance_id     uuid not null references public.n8n_instances(id) on delete cascade,
  workflow_id     uuid references public.workflows(id) on delete set null,
  workflow_name   text not null,
  severity        text not null default 'medium' check (severity in ('critical', 'high', 'medium', 'low')),
  status          text not null default 'open' check (status in ('open', 'investigating', 'resolved')),
  title           text not null,
  failure_count   int not null default 1,
  first_seen_at   timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  resolved_at     timestamptz,
  assigned_to     uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_incidents_instance_id on public.incidents(instance_id);
create index idx_incidents_status on public.incidents(status);
create index idx_incidents_workflow_id on public.incidents(workflow_id);

-- ─── Alerts ───────────────────────────────────────────────────────────────────
create table public.alerts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  instance_id         uuid not null references public.n8n_instances(id) on delete cascade,
  workflow_id         uuid references public.workflows(id) on delete cascade,
  name                text not null,
  channel             text not null check (channel in ('slack', 'email', 'webhook')),
  destination         text not null,
  threshold_count     int not null default 1,
  threshold_minutes   int not null default 10,
  cooldown_minutes    int not null default 30,
  is_active           boolean not null default true,
  last_triggered_at   timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_alerts_user_id on public.alerts(user_id);
create index idx_alerts_instance_id on public.alerts(instance_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Users can only see their own data

alter table public.users enable row level security;
alter table public.n8n_instances enable row level security;
alter table public.workflows enable row level security;
alter table public.executions enable row level security;
alter table public.incidents enable row level security;
alter table public.alerts enable row level security;

-- Note: FlowWatch uses custom JWT auth, not Supabase Auth.
-- RLS is enforced server-side via service role key in API routes.
-- These policies are for additional safety — using auth.uid() if Supabase Auth is added later.

-- ─── Updated_at trigger ───────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on public.users
  for each row execute function update_updated_at();
create trigger instances_updated_at before update on public.n8n_instances
  for each row execute function update_updated_at();
create trigger workflows_updated_at before update on public.workflows
  for each row execute function update_updated_at();
create trigger incidents_updated_at before update on public.incidents
  for each row execute function update_updated_at();
create trigger alerts_updated_at before update on public.alerts
  for each row execute function update_updated_at();
