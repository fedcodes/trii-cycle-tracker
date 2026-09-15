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

-- ── objectives (catálogo global — dropdown de bets + Discovery) ──
create table if not exists objectives (
  id uuid primary key default gen_random_uuid(),
  num int not null unique,
  label text not null,
  short_name text not null,
  color text not null default 'obj-99',
  short_description text not null default '',
  metric text not null default '',
  po text not null default '',
  designer text not null default '',
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Columnas agregadas después del primer deploy (idempotente).
alter table objectives add column if not exists short_description text not null default '';
alter table objectives add column if not exists metric text not null default '';
alter table objectives add column if not exists po text not null default '';
alter table objectives add column if not exists designer text not null default '';

drop trigger if exists objectives_updated_at on objectives;
create trigger objectives_updated_at before update on objectives
  for each row execute function set_updated_at();

-- Seed del catálogo (idempotente — no pisa ediciones hechas desde Admin).
insert into objectives (num, label, short_name, color, short_description, metric, active, position) values
  (1,  'Obj. 1 — Escalar trii pro',    'Pro',          'obj-1',
       'Llegar al 10% de penetración de trii pro entre los usuarios activos de los 3 países.',
       '10% de penetración pro · Fin 2026', true, 1),
  (2,  'Obj. 2 — US Stocks CO & PE',   'US Stocks',    'obj-2',
       'Habilitar compra-venta de acciones americanas desde Colombia y Perú.',
       'US Stocks live en CO + PE · Q2 2026', true, 2),
  (3,  'Obj. 3 — Chile',               'Chile',        'obj-3',
       'Cerrar la brecha de paridad de producto en Chile.',
       'Paridad funcional con CO/PE · Q3 2026', true, 3),
  (4,  'Obj. 4 — Experiencia CX',      'CX',           'obj-4',
       'Subir la activación del ~30% al 50% con el nuevo onboarding y menos fricción en depósitos.',
       'Activación 30% → 50% · Fin 2026', true, 4),
  (5,  'Obj. 5 — Fondos Perú',         'Fondos PE',    'obj-5',
       'Crecer los AUMs de fondos Blum en Perú — compromiso contractual.',
       'USD 10M en AUMs · Fin 2026', true, 5),
  (98, 'Arquitectura',                 'Arquitectura', 'obj-99',
       'Deuda técnica, librería de componentes y salud de la plataforma.', '', true, 98),
  (99, 'Regulatorio',                  'Regulatorio',  'obj-99',
       'Temas regulatorios y asks puntuales de otras áreas.', '', true, 99)
on conflict (num) do nothing;

-- Backfill para DBs que ya tenían el catálogo sin estos campos (solo llena vacíos).
update objectives o set
  short_description = s.short_description,
  metric = s.metric
from (values
  (1,  'Llegar al 10% de penetración de trii pro entre los usuarios activos de los 3 países.', '10% de penetración pro · Fin 2026'),
  (2,  'Habilitar compra-venta de acciones americanas desde Colombia y Perú.', 'US Stocks live en CO + PE · Q2 2026'),
  (3,  'Cerrar la brecha de paridad de producto en Chile.', 'Paridad funcional con CO/PE · Q3 2026'),
  (4,  'Subir la activación del ~30% al 50% con el nuevo onboarding y menos fricción en depósitos.', 'Activación 30% → 50% · Fin 2026'),
  (5,  'Crecer los AUMs de fondos Blum en Perú — compromiso contractual.', 'USD 10M en AUMs · Fin 2026'),
  (98, 'Deuda técnica, librería de componentes y salud de la plataforma.', ''),
  (99, 'Temas regulatorios y asks puntuales de otras áreas.', '')
) as s(num, short_description, metric)
where o.num = s.num and o.short_description = '' and o.metric = '';

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

-- Bet movida desde el ciclo anterior al crear el siguiente (null = nació en este ciclo).
alter table bets add column if not exists carried_from_cycle_id uuid references cycles(id) on delete set null;

-- ── Transición de ciclo ────────────────────────────────────
-- Crea el siguiente ciclo en una sola transacción: desactiva el ciclo activo,
-- inserta el nuevo como activo y mueve las bets indicadas. Las bets que no se
-- mueven (Listo, descartadas) quedan archivadas en el ciclo anterior junto con
-- su historial de updates. Se invoca desde la app vía supabase.rpc().
create or replace function create_next_cycle(
  p_name text,
  p_start_date date,
  p_end_date date,
  p_cooldown_start date,
  p_cooldown_end date,
  p_total_weeks int,
  p_previous_cycle_id uuid,
  p_move_bet_ids uuid[]
) returns uuid
language plpgsql
as $$
declare
  v_id uuid;
  v_weeks int := coalesce(p_total_weeks, 6);
begin
  update cycles set is_active = false where is_active;

  insert into cycles (name, start_date, end_date, cooldown_start, cooldown_end, total_weeks, is_active)
  values (p_name, p_start_date, p_end_date, p_cooldown_start, p_cooldown_end, v_weeks, true)
  returning id into v_id;

  if p_previous_cycle_id is not null and coalesce(array_length(p_move_bet_ids, 1), 0) > 0 then
    update bets set
      cycle_id = v_id,
      carried_from_cycle_id = p_previous_cycle_id,
      -- arranca en S1 conservando la duración original (acotada al nuevo ciclo)
      week_start = 1,
      week_end = greatest(1, least(v_weeks, week_end - week_start + 1)),
      -- "Pushed" describía el empuje al siguiente ciclo; ya llegó.
      status = case when status = 'Pushed' then 'Not started' else status end
    where id = any(p_move_bet_ids)
      and cycle_id = p_previous_cycle_id;
  end if;

  return v_id;
end;
$$;

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

-- objective_id null = task sin objetivo (p. ej. su objetivo fue desactivado en Admin).
create table if not exists discovery_tasks (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid references cycles(id) on delete cascade,
  objective_id uuid references discovery_objectives(id) on delete set null,
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

-- Migración: el objetivo de una task es opcional (desactivar un objetivo en
-- Admin des-asigna sus tasks). Idempotente.
alter table discovery_tasks add column if not exists cycle_id uuid references cycles(id) on delete cascade;
update discovery_tasks t set cycle_id = o.cycle_id
  from discovery_objectives o
  where t.objective_id = o.id and t.cycle_id is null;
alter table discovery_tasks alter column objective_id drop not null;
alter table discovery_tasks drop constraint if exists discovery_tasks_objective_id_fkey;
alter table discovery_tasks add constraint discovery_tasks_objective_id_fkey
  foreign key (objective_id) references discovery_objectives(id) on delete set null;

-- Backfill de PO/diseño del catálogo desde las cards de Discovery
-- (solo llena vacíos; va después de crear discovery_objectives).
update objectives o set
  po = coalesce(d.po, ''),
  designer = coalesce(d.designer, '')
from discovery_objectives d
where d.obj_num = o.num and o.po = '' and o.designer = '';

-- ── Discovery es independiente del ciclo ───────────────────
-- El tablero de Discovery (cards de objetivos + tasks) es uno solo y persiste
-- entre ciclos; cycle_id queda como columna legacy nullable y borrar un ciclo
-- ya no arrastra nada de Discovery. Idempotente.
alter table discovery_objectives alter column cycle_id drop not null;
alter table discovery_objectives drop constraint if exists discovery_objectives_cycle_id_fkey;
alter table discovery_objectives add constraint discovery_objectives_cycle_id_fkey
  foreign key (cycle_id) references cycles(id) on delete set null;
alter table discovery_tasks drop constraint if exists discovery_tasks_cycle_id_fkey;
alter table discovery_tasks add constraint discovery_tasks_cycle_id_fkey
  foreign key (cycle_id) references cycles(id) on delete set null;

-- Consolidar cards duplicadas por objetivo (una por ciclo hasta ahora): se
-- conserva la que tiene tasks (luego la que tiene PO), y las tasks de las
-- demás se re-apuntan a ella antes de borrarlas.
update discovery_tasks t set objective_id = r.keep_id
from (
  select o.id,
         first_value(o.id) over (
           partition by o.obj_num
           order by (select count(*) from discovery_tasks x where x.objective_id = o.id) desc,
                    (coalesce(o.po, '') <> '') desc,
                    o.position, o.id
         ) as keep_id
  from discovery_objectives o
) r
where t.objective_id = r.id and r.id <> r.keep_id;

delete from discovery_objectives
where id in (
  select id from (
    select o.id,
           row_number() over (
             partition by o.obj_num
             order by (select count(*) from discovery_tasks x where x.objective_id = o.id) desc,
                      (coalesce(o.po, '') <> '') desc,
                      o.position, o.id
           ) as rn
    from discovery_objectives o
  ) r where r.rn > 1
);

update discovery_objectives set cycle_id = null where cycle_id is not null;
update discovery_tasks set cycle_id = null where cycle_id is not null;

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

-- ── link: discovery task ← idea del backlog ────────────────
-- Una task de discovery puede nacer de una idea del backlog; al mover la task
-- de etapa se sincroniza el status de la idea. Idempotente.
alter table discovery_tasks add column if not exists backlog_id uuid references backlog_ideas(id) on delete set null;

-- ── RLS: internal tool, anon key has full access (same model as before).
-- Tighten with Supabase Auth if the URL ever becomes public.
do $$
declare t text;
begin
  foreach t in array array['objectives','cycles','bets','bet_updates','discovery_objectives','discovery_tasks','backlog_ideas']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "public access" on %I', t);
    execute format('create policy "public access" on %I for all using (true) with check (true)', t);
  end loop;
end $$;
