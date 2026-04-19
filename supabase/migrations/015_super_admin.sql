alter table users
  add column if not exists is_super_admin boolean not null default false;
