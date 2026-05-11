-- Migration 023: add user_id and org_id to page_visits
-- Lets us identify which signed-in user/org generated each dashboard page visit

alter table public.page_visits
  add column if not exists user_id uuid references public.users(id) on delete set null,
  add column if not exists org_id  uuid references public.organizations(id) on delete set null;

create index if not exists page_visits_user_idx on public.page_visits (user_id, created_at desc)
  where user_id is not null;

create index if not exists page_visits_org_idx  on public.page_visits (org_id,  created_at desc)
  where org_id is not null;
