-- Run this in Supabase SQL Editor to create all tables

create table if not exists sp_users (
  id text primary key,
  first text, last text, email text unique, pass text,
  role text default 'rep',
  perms jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists sp_pins (
  id text primary key,
  lat float8, lng float8, status text, address text,
  rep_id text, created_at timestamptz default now()
);

create table if not exists sp_leads (
  id text primary key,
  pin_id text, name text, phone text, email text,
  address text, status text, details text,
  value text, rep_id text, notes text,
  created_at timestamptz default now()
);

create table if not exists sp_events (
  id text primary key,
  title text, start_time text, end_time text,
  type text, client_id text, rep_id text, notes text, value text,
  created_at timestamptz default now()
);

create table if not exists sp_zones (
  id text primary key,
  points jsonb, color text, name text,
  rep_id text, created_at timestamptz default now()
);

create table if not exists sp_acts (
  id text primary key,
  title text, sub text, created_at timestamptz default now()
);

-- Allow public read/write (RLS off for simplicity - app handles auth)
alter table sp_users enable row level security;
alter table sp_pins enable row level security;
alter table sp_leads enable row level security;
alter table sp_events enable row level security;
alter table sp_zones enable row level security;
alter table sp_acts enable row level security;

create policy "public_all" on sp_users for all using (true) with check (true);
create policy "public_all" on sp_pins for all using (true) with check (true);
create policy "public_all" on sp_leads for all using (true) with check (true);
create policy "public_all" on sp_events for all using (true) with check (true);
create policy "public_all" on sp_zones for all using (true) with check (true);
create policy "public_all" on sp_acts for all using (true) with check (true);
