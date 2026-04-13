-- Users (no password_hash)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- PIN verifications (short-lived)
create table if not exists pin_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  pin_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists pin_verifications_email_idx on pin_verifications (email, expires_at);

-- Organizations
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text not null default 'free',
  created_at timestamptz default now()
);

-- Organization members
create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null default 'viewer',
  invited_by uuid references users(id),
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

-- Organization invites
create table if not exists organization_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  email text not null,
  role text not null default 'viewer',
  token text unique not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  invited_by uuid references users(id),
  created_at timestamptz default now()
);

-- n8n instances (uses org_id instead of user_id)
create table if not exists n8n_instances (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  url text not null,
  api_key_encrypted text not null,
  api_key_hint text not null,
  is_active boolean default true,
  last_synced_at timestamptz,
  created_at timestamptz default now()
);
