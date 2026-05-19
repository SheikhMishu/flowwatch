-- Migration 032: unique visitor / user RPCs for admin analytics
-- Replaces the raw user_id fetch with limit(50000) in the visitors page.

-- Unique visitors by distinct IP within a time window
create or replace function admin_unique_visitors(
  p_source       text,
  p_since        timestamptz,
  p_excluded_ips text[] default array[]::text[]
)
returns table(count bigint)
language sql stable security definer as $$
  select count(distinct ip)::bigint as count
  from page_visits
  where
    source = p_source
    and created_at >= p_since
    and (array_length(p_excluded_ips, 1) is null or ip != all(p_excluded_ips));
$$;

-- Unique authenticated users (distinct user_id) in the app within a time window
create or replace function admin_unique_app_users(
  p_since        timestamptz,
  p_excluded_ips text[] default array[]::text[]
)
returns table(count bigint)
language sql stable security definer as $$
  select count(distinct user_id)::bigint as count
  from page_visits
  where
    source = 'app'
    and user_id is not null
    and created_at >= p_since
    and (array_length(p_excluded_ips, 1) is null or ip != all(p_excluded_ips));
$$;
