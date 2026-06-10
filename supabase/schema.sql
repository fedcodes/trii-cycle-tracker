-- trii-cycle-tracker schema
-- Apply with: npm run db:setup (scripts/setup-db.mjs) or paste into the Supabase SQL editor.
-- Idempotent: safe to re-run.

create extension if not exists pgcrypto;

-- ── updated_at trigger helper ──────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── cycles ─────────────────────────────────────────────────
create table if not exists cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  cooldown_start date,
  cooldown_end date,
  total_weeks int not null default 6,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── bets (Estado del Ciclo) ────────────────────────────────
create table if not exists bets (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references cycles(id) on delete cascade,
  name text not null,
  objective_num int not null default 1,
  objective text not null default '',
  team text[] not null default '{}',
  status text not null default 'Not started',
  week_start int not null default 1,
  week_end int not null default 1,
  progress numeric not null default 0,
  last_update text not null default '',
  dropped boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists bets_updated_at on bets;
create trigger bets_updated_at before update on bets
  for each row execute function set_updated_at();

-- ── bet_updates (project update history + weekly log) ──────
-- bet_id null = general cycle note (shows only in the weekly log)
create table if not exists bet_updates (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references cycles(id) on delete cascade,
  bet_id uuid references bets(id) on delete cascade,
  week int not null default 1,
  note text not null,
  progress numeric,
  status text,
  created_at timestamptz not null default now()
);

-- ── discovery ──────────────────────────────────────────────
create table if not exists discovery_objectives (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references cycles(id) on delete cascade,
  obj_num int not null,
  name text not null,
  short_name text not null,
  description text not null default '',
  metric text not null default '',
  target text not null default '',
  po text,
  designer text,
  context text,
  position int not null default 0
);

create table if not exists discovery_tasks (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references discovery_objectives(id) on delete cascade,
  name text not null,
  stage text not null default 'backlog',
  owner text,
  designer text,
  priority text not null default 'med',
  figma text,
  notes text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists discovery_tasks_updated_at on discovery_tasks;
create trigger discovery_tasks_updated_at before update on discovery_tasks
  for each row execute function set_updated_at();

-- ── backlog_ideas (Backlog tab — schema matches existing UI) ──
create table if not exists backlog_ideas (
  id uuid primary key default gen_random_uuid(),
  vertical text not null default '',
  idea text not null default '',
  objective text not null default '',
  responsable text not null default '',
  countries text[] not null default '{}',
  impact text not null default '',
  effort text not null default '',
  status text not null default 'Pending',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists backlog_ideas_updated_at on backlog_ideas;
create trigger backlog_ideas_updated_at before update on backlog_ideas
  for each row execute function set_updated_at();

-- ── RLS: internal tool, anon key has full access (same model as before).
-- Tighten with Supabase Auth if the URL ever becomes public.
do $$
declare t text;
begin
  foreach t in array array['cycles','bets','bet_updates','discovery_objectives','discovery_tasks','backlog_ideas']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "public access" on %I', t);
    execute format('create policy "public access" on %I for all using (true) with check (true)', t);
  end loop;
end $$;
