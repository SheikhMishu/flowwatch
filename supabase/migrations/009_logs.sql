-- ─── System / error logs ─────────────────────────────────────────────────────
-- Captures warn + error + fatal events from the application.
-- debug and info only go to stdout (Railway log viewer) — not persisted.

create table if not exists app_logs (
  id          uuid        primary key default gen_random_uuid(),
  level       varchar(8)  not null check (level in ('warn', 'error', 'fatal')),
  category    varchar(64) not null,   -- e.g. 'sync', 'auth', 'ai', 'alert-engine'
  message     text        not null,
  context     jsonb,                  -- arbitrary structured context
  org_id      uuid        references organizations(id) on delete set null,
  user_id     uuid,                   -- no FK — users table may use different id type
  created_at  timestamptz not null default now()
);

create index if not exists app_logs_level_idx    on app_logs (level, created_at desc);
create index if not exists app_logs_org_idx      on app_logs (org_id, created_at desc);
create index if not exists app_logs_category_idx on app_logs (category, created_at desc);

-- ─── User activity / audit logs ───────────────────────────────────────────────
-- Immutable audit trail: who did what, when.
-- Never updated — only inserted. Scoped to org_id for multi-tenancy.

create table if not exists activity_logs (
  id            uuid        primary key default gen_random_uuid(),
  org_id        uuid        references organizations(id) on delete cascade not null,
  user_id       text,                  -- stored as text to handle demo + real users
  user_email    text,
  user_name     text,
  action        varchar(64) not null,  -- e.g. 'instance.created', 'incident.resolved'
  resource_type varchar(32),           -- e.g. 'instance', 'incident', 'alert'
  resource_id   text,                  -- id of the affected resource
  metadata      jsonb,                 -- before/after values, extra context
  ip            text,
  created_at    timestamptz not null default now()
);

create index if not exists activity_logs_org_idx    on activity_logs (org_id, created_at desc);
create index if not exists activity_logs_user_idx   on activity_logs (user_id, created_at desc);
create index if not exists activity_logs_action_idx on activity_logs (org_id, action, created_at desc);
