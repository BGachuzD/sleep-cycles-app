-- Fase 5 · Metas de sueño
-- Una fila por (user_id, type). MVP usa el type 'duration' (objetivo en minutos).
-- Reutiliza el trigger set_updated_at() de la migración inicial.
-- Migración idempotente.

set search_path = public;

create table if not exists public.sleep_goals (
  id             uuid primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  type           text not null,
  target_minutes integer not null check (target_minutes > 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, type)
);

create index if not exists idx_sleep_goals_user on public.sleep_goals (user_id);

drop trigger if exists set_sleep_goals_updated_at on public.sleep_goals;
create trigger set_sleep_goals_updated_at
  before update on public.sleep_goals
  for each row execute function public.set_updated_at();

alter table public.sleep_goals enable row level security;

drop policy if exists "sleep_goals owner full access" on public.sleep_goals;
create policy "sleep_goals owner full access"
  on public.sleep_goals
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
