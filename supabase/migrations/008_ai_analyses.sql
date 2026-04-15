-- Global AI analysis cache
-- Keyed on (error_signature, tier) so same error pattern reuses the same result
-- Not org-scoped — one call benefits all orgs with identical errors

create table if not exists ai_analyses (
  id             uuid        primary key default gen_random_uuid(),
  error_signature varchar(16) not null,
  tier           varchar(8)  not null check (tier in ('free', 'pro')),
  model          varchar(64) not null,
  -- structured fields (pro only; null for free)
  cause          text,
  fix_steps      jsonb,
  prevention     text,
  -- raw fallback (free tier)
  raw_response   text        not null,
  created_at     timestamptz not null default now()
);

create index if not exists ai_analyses_lookup
  on ai_analyses (error_signature, tier);

-- store error_message on incidents so AI panel has the raw error text
alter table incidents
  add column if not exists error_message text;

-- also add "team" to organizations plan enum if not already present
alter table organizations
  drop constraint if exists organizations_plan_check;

alter table organizations
  add constraint organizations_plan_check
  check (plan in ('free', 'pro', 'team', 'enterprise'));
