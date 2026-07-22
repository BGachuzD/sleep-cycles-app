-- Fase 5 · Bitácora de sueños independiente
-- Los sueños viven en su propia tabla, desacoplados de sleep_log: puedes anotar
-- un sueño en cualquier momento (p. ej. 3 a.m.) sin registrar cómo dormiste.
-- Varias entradas por día permitidas (sin unique). Migración idempotente.

set search_path = public;

create table if not exists public.dream_entries (
  id         uuid primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  logged_at  timestamptz not null,       -- cuándo se anotó (trazabilidad)
  date       date not null,              -- fecha local de referencia del sueño
  mood       smallint,                   -- 1 = malo, 2 = bueno (nullable)
  tags       text[],
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists idx_dream_entries_user_logged
  on public.dream_entries (user_id, logged_at desc);

alter table public.dream_entries
  drop constraint if exists dream_entries_mood_check;
alter table public.dream_entries
  add constraint dream_entries_mood_check
  check (mood is null or mood between 1 and 2);

alter table public.dream_entries enable row level security;

drop policy if exists "dream_entries owner full access" on public.dream_entries;
create policy "dream_entries owner full access"
  on public.dream_entries
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
