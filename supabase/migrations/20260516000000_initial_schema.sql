-- Sleep Cycles App — esquema inicial
-- Crea las tres tablas de usuario (sleep_profiles, sleep_log, sleep_routine_steps),
-- habilita RLS y restringe acceso a las filas del propio auth.uid().
-- ON DELETE CASCADE en la FK a auth.users garantiza que la Edge Function
-- delete-account borre toda la información del usuario al eliminar la cuenta.

set search_path = public;

-- ─────────────────────────────────────────────────────────────
-- Trigger genérico: mantiene updated_at en sync con NOW()
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- sleep_profiles  —  un perfil por usuario
-- ─────────────────────────────────────────────────────────────
create table if not exists public.sleep_profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  age          smallint not null check (age between 0 and 130),
  weight_kg    numeric(5,2) not null check (weight_kg > 0 and weight_kg < 400),
  height_cm    numeric(5,2) not null check (height_cm > 0 and height_cm < 300),
  gender       text not null check (gender in ('male', 'female', 'other')),
  chronotype   text check (chronotype in ('morning', 'intermediate', 'night')),
  wake_hour    smallint check (wake_hour between 0 and 23),
  wake_minute  smallint check (wake_minute between 0 and 59),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_sleep_profiles_updated_at on public.sleep_profiles;
create trigger trg_sleep_profiles_updated_at
  before update on public.sleep_profiles
  for each row execute function public.set_updated_at();

alter table public.sleep_profiles enable row level security;

drop policy if exists "sleep_profiles owner full access" on public.sleep_profiles;
create policy "sleep_profiles owner full access"
  on public.sleep_profiles
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- sleep_log  —  una entrada por noche
-- ─────────────────────────────────────────────────────────────
create table if not exists public.sleep_log (
  id             uuid primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  date           date not null,
  bed_time_iso   timestamptz not null,
  wake_time_iso  timestamptz not null,
  feeling        smallint not null check (feeling between 1 and 3),
  unique (user_id, date)
);

create index if not exists idx_sleep_log_user_date
  on public.sleep_log (user_id, date desc);

alter table public.sleep_log enable row level security;

drop policy if exists "sleep_log owner full access" on public.sleep_log;
create policy "sleep_log owner full access"
  on public.sleep_log
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- sleep_routine_steps  —  pasos personalizados de la rutina nocturna
-- ─────────────────────────────────────────────────────────────
create table if not exists public.sleep_routine_steps (
  user_id         uuid not null references auth.users(id) on delete cascade,
  id              text not null,
  minutes_before  integer not null check (minutes_before >= 0),
  icon            text not null,
  title           text not null,
  description     text not null,
  color           text not null,
  enabled         boolean not null default true,
  is_default      boolean not null default false,
  primary key (user_id, id)
);

create index if not exists idx_sleep_routine_steps_user
  on public.sleep_routine_steps (user_id);

alter table public.sleep_routine_steps enable row level security;

drop policy if exists "sleep_routine_steps owner full access" on public.sleep_routine_steps;
create policy "sleep_routine_steps owner full access"
  on public.sleep_routine_steps
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
