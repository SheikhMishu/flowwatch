-- Migration 031: Admin overview aggregate RPCs
-- Replaces raw row fetches (limit 10000) with DB-side aggregation.
-- All functions are security definer so they run as the migration owner.

-- AI usage summary: all-time total + current calendar month
create or replace function admin_ai_usage_summary()
returns table(total bigint, this_month bigint)
language sql stable security definer as $$
  select
    coalesce(sum(count), 0)::bigint                                                           as total,
    coalesce(sum(count) filter (where month = date_trunc('month', now())::date), 0)::bigint  as this_month
  from ai_usage;
$$;

-- Plan breakdown: org count per plan tier (always returns exactly one row)
create or replace function admin_plan_breakdown()
returns table(free bigint, pro bigint, team bigint, enterprise bigint)
language sql stable security definer as $$
  select
    count(*) filter (where plan = 'free')::bigint       as free,
    count(*) filter (where plan = 'pro')::bigint        as pro,
    count(*) filter (where plan = 'team')::bigint       as team,
    count(*) filter (where plan = 'enterprise')::bigint as enterprise
  from organizations;
$$;

-- Recent orgs: latest N orgs with owner email (left-join so org still appears if no owner row)
create or replace function admin_recent_orgs(p_limit int default 8)
returns table(
  org_id       uuid,
  org_name     text,
  plan         text,
  plan_status  text,
  owner_email  text,
  created_at   timestamptz
)
language sql stable security definer as $$
  select
    o.id          as org_id,
    o.name        as org_name,
    o.plan,
    o.plan_status,
    u.email       as owner_email,
    o.created_at
  from organizations o
  left join organization_members om on om.org_id = o.id and om.role = 'owner'
  left join users u on u.id = om.user_id
  order by o.created_at desc
  limit p_limit;
$$;

-- Churn stats: counts by subscription status (always returns exactly one row)
create or replace function admin_churn_stats()
returns table(canceled bigint, canceling bigint, past_due bigint)
language sql stable security definer as $$
  select
    count(*) filter (where plan_status = 'canceled')::bigint  as canceled,
    count(*) filter (where plan_status = 'canceling')::bigint as canceling,
    count(*) filter (where plan_status = 'past_due')::bigint  as past_due
  from organizations;
$$;

-- Active vs ghost orgs (always returns exactly one row)
-- active  = org has at least one n8n instance (connected, even if inactive)
-- ghost   = org has zero n8n instances (signed up, never connected)
create or replace function admin_active_ghost_stats()
returns table(active_orgs bigint, ghost_orgs bigint)
language sql stable security definer as $$
  select
    count(*) filter (where exists (
      select 1 from n8n_instances i where i.org_id = o.id
    ))::bigint as active_orgs,
    count(*) filter (where not exists (
      select 1 from n8n_instances i where i.org_id = o.id
    ))::bigint as ghost_orgs
  from organizations o;
$$;
