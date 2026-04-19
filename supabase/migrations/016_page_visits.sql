-- Migration 016: page visit tracking
-- Stores every page visit with IP, geo, browser, device info

create table if not exists public.page_visits (
  id           uuid        primary key default gen_random_uuid(),
  page         text        not null,
  ip           text,
  country      text,
  country_code text,
  city         text,
  region       text,
  user_agent   text,
  browser      text,
  os           text,
  device       text,        -- 'desktop' | 'mobile' | 'tablet' | 'bot'
  referrer     text,
  created_at   timestamptz not null default now()
);

create index if not exists page_visits_created_idx  on public.page_visits (created_at desc);
create index if not exists page_visits_page_idx     on public.page_visits (page, created_at desc);
create index if not exists page_visits_ip_idx       on public.page_visits (ip, created_at desc);
create index if not exists page_visits_country_idx  on public.page_visits (country_code, created_at desc);
create index if not exists page_visits_device_idx   on public.page_visits (device, created_at desc);
