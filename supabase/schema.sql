-- AI Life Simulator — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`) before using
-- the app with a real Supabase project. The app also works without this
-- schema applied (it falls back to browser localStorage) so you can try the
-- MVP before wiring up a database.

create extension if not exists "pgcrypto";

create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age integer not null,
  cash numeric not null default 0,
  health integer not null default 75 check (health between 0 and 100),
  happiness integer not null default 65 check (happiness between 0 and 100),
  stress integer not null default 25 check (stress between 0 and 100),
  energy integer not null default 80 check (energy between 0 and 100),
  job_title text,
  job_salary numeric,
  job_performance integer default 0,
  education text not null default 'high_school',
  study_progress integer not null default 0,
  personality_traits text[] not null default '{}',
  life_goals text[] not null default '{}',
  months_elapsed integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists relationships (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters (id) on delete cascade,
  name text not null,
  type text not null check (type in ('family', 'friend', 'partner', 'colleague')),
  closeness integer not null default 50 check (closeness between 0 and 100)
);

create table if not exists life_events (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters (id) on delete cascade,
  month integer not null,
  title text not null,
  description text not null,
  category text not null check (category in ('work', 'health', 'social', 'finance', 'random')),
  stat_changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists life_events_character_id_created_at_idx
  on life_events (character_id, created_at desc);

create index if not exists relationships_character_id_idx
  on relationships (character_id);

-- MVP note: this app has no auth system yet, so Row Level Security is left
-- permissive (anon key can read/write). Before shipping beyond a personal
-- demo, add a `user_id` column tied to Supabase Auth and RLS policies
-- scoping every table to `auth.uid() = user_id`.
alter table characters enable row level security;
alter table relationships enable row level security;
alter table life_events enable row level security;

create policy "public read/write (MVP, no auth)" on characters
  for all using (true) with check (true);
create policy "public read/write (MVP, no auth)" on relationships
  for all using (true) with check (true);
create policy "public read/write (MVP, no auth)" on life_events
  for all using (true) with check (true);
