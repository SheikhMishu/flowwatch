-- Migration 020: demo account tracking
-- Tracks demo login sessions and per-page visits separately from real users

create table if not exists public.demo_sessions (
  id              uuid        primary key default gen_random_uuid(),
  session_token   text        not null unique,
  started_at      timestamptz not null default now(),
  last_active_at  timestamptz not null default now(),
  page_count      int         not null default 0,
  ip              text
);

create index if not exists demo_sessions_started_idx      on public.demo_sessions (started_at desc);
create index if not exists demo_sessions_token_idx        on public.demo_sessions (session_token);
create index if not exists demo_sessions_last_active_idx  on public.demo_sessions (last_active_at desc);

create table if not exists public.demo_page_visits (
  id             uuid        primary key default gen_random_uuid(),
  session_token  text        not null references public.demo_sessions(session_token) on delete cascade,
  page           text        not null,
  visited_at     timestamptz not null default now()
);

create index if not exists demo_page_visits_session_idx   on public.demo_page_visits (session_token, visited_at desc);
create index if not exists demo_page_visits_page_idx      on public.demo_page_visits (page, visited_at desc);
create index if not exists demo_page_visits_visited_idx   on public.demo_page_visits (visited_at desc);

-- Atomic page count increment to avoid read-modify-write race
create or replace function public.demo_increment_page_count(p_token text)
returns void language sql security definer as $$
  update public.demo_sessions
  set page_count     = page_count + 1,
      last_active_at = now()
  where session_token = p_token;
$$;
