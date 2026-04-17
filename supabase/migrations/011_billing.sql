-- Stripe billing fields on organizations
-- plan column already exists from 001_init.sql (default 'free')

alter table organizations
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists plan_status text not null default 'active',
  add column if not exists current_period_end timestamptz;

create index if not exists organizations_stripe_customer_idx
  on organizations (stripe_customer_id);

create index if not exists organizations_stripe_sub_idx
  on organizations (stripe_subscription_id);
