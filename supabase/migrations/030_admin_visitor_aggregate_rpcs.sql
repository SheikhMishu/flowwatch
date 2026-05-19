-- RPCs for admin visitor analytics breakdowns — replaces raw row fetches with limit(20000)

-- Top pages by source
create or replace function admin_top_pages(
  p_source       text,
  p_days         int      default 30,
  p_limit        int      default 10,
  p_excluded_ips text[]   default array[]::text[]
)
returns table(page text, count bigint)
language sql stable security definer as $$
  select page, count(*)::bigint as count
  from page_visits
  where
    source = p_source
    and created_at >= now() - (p_days || ' days')::interval
    and (array_length(p_excluded_ips, 1) is null or ip != all(p_excluded_ips))
  group by page
  order by count desc
  limit p_limit
$$;

-- Top countries by source
create or replace function admin_top_countries(
  p_source       text,
  p_days         int      default 30,
  p_limit        int      default 10,
  p_excluded_ips text[]   default array[]::text[]
)
returns table(country text, country_code text, count bigint)
language sql stable security definer as $$
  select country, country_code, count(*)::bigint as count
  from page_visits
  where
    source = p_source
    and created_at >= now() - (p_days || ' days')::interval
    and country_code is not null
    and (array_length(p_excluded_ips, 1) is null or ip != all(p_excluded_ips))
  group by country, country_code
  order by count desc
  limit p_limit
$$;

-- Device breakdown by source
create or replace function admin_device_breakdown(
  p_source       text,
  p_days         int      default 30,
  p_excluded_ips text[]   default array[]::text[]
)
returns table(device text, count bigint)
language sql stable security definer as $$
  select coalesce(device, 'unknown') as device, count(*)::bigint as count
  from page_visits
  where
    source = p_source
    and created_at >= now() - (p_days || ' days')::interval
    and (array_length(p_excluded_ips, 1) is null or ip != all(p_excluded_ips))
  group by device
  order by count desc
$$;

-- Top referrers by source (raw URLs — hostname extraction stays in JS)
create or replace function admin_top_referrers(
  p_source       text,
  p_days         int      default 30,
  p_limit        int      default 50,
  p_excluded_ips text[]   default array[]::text[]
)
returns table(referrer text, count bigint)
language sql stable security definer as $$
  select referrer, count(*)::bigint as count
  from page_visits
  where
    source = p_source
    and created_at >= now() - (p_days || ' days')::interval
    and referrer is not null
    and (array_length(p_excluded_ips, 1) is null or ip != all(p_excluded_ips))
  group by referrer
  order by count desc
  limit p_limit
$$;

-- Top browsers by source (strips version number in DB)
create or replace function admin_top_browsers(
  p_source       text,
  p_days         int      default 30,
  p_limit        int      default 6,
  p_excluded_ips text[]   default array[]::text[]
)
returns table(browser text, count bigint)
language sql stable security definer as $$
  select
    split_part(coalesce(browser, 'Unknown'), ' ', 1) as browser,
    count(*)::bigint as count
  from page_visits
  where
    source = p_source
    and created_at >= now() - (p_days || ' days')::interval
    and (array_length(p_excluded_ips, 1) is null or ip != all(p_excluded_ips))
  group by 1
  order by count desc
  limit p_limit
$$;
