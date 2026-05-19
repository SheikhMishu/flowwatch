-- RPC for admin visitor analytics: aggregate daily visit counts by source in DB
-- Returns one row per day that has visits (no zero-fill — done in JS).
-- Called from admin visitors page instead of raw row fetches to avoid the 20k limit.

create or replace function admin_daily_visit_counts(
  p_source  text,
  p_days    int      default 30,
  p_excluded_ips text[] default array[]::text[]
)
returns table(day text, count bigint)
language sql
stable
security definer
as $$
  select
    to_char(
      (created_at at time zone 'Australia/Melbourne')::date,
      'YYYY-MM-DD'
    ) as day,
    count(*)::bigint as count
  from page_visits
  where
    source = p_source
    and created_at >= now() - (p_days || ' days')::interval
    and (
      array_length(p_excluded_ips, 1) is null
      or ip != all(p_excluded_ips)
    )
  group by 1
  order by 1
$$;
