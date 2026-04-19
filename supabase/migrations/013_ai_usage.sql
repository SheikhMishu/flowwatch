-- Migration 013: per-org monthly AI usage tracking
-- Only non-cached pro/team calls are counted (cached hits are free and don't touch this table)

create table if not exists public.ai_usage (
  org_id  uuid not null,
  month   date not null,  -- first day of month, e.g. 2026-04-01
  count   integer not null default 0,
  primary key (org_id, month)
);

create index if not exists ai_usage_org_month on public.ai_usage (org_id, month);

-- Atomic upsert-increment called after each successful non-cached AI call
create or replace function increment_ai_usage(p_org_id uuid, p_month date)
returns void language plpgsql as $$
begin
  insert into ai_usage (org_id, month, count)
  values (p_org_id, p_month, 1)
  on conflict (org_id, month)
  do update set count = ai_usage.count + 1;
end;
$$;
