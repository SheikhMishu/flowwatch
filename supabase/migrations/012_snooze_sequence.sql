-- Migration 012: snooze support on alerts + landing page signups table with email sequence tracking

-- Create signups table (used by landing page — may not exist yet)
create table if not exists public.signups (
  id             uuid primary key default gen_random_uuid(),
  email          text unique not null,
  instances      text not null default '',
  agency         text not null default '',
  sequence_step  integer not null default 0,
  created_at     timestamptz not null default now()
);

-- Snooze support on alerts
alter table public.alerts add column if not exists snoozed_until timestamptz;
