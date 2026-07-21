-- Fase 5 · Bitácora de sueños
-- Agrega campos opcionales de "sueño" a cada noche registrada en sleep_log.
-- Todos nullable: una noche puede registrarse sin ningún dato de sueño (p. ej.
-- las importadas de HealthKit). Hereda la RLS existente de sleep_log
-- ("sleep_log owner full access"), no requiere policies nuevas.
-- Migración idempotente.

set search_path = public;

alter table public.sleep_log
  add column if not exists dreamed    boolean,
  add column if not exists dream_mood smallint,   -- 1 = malo, 2 = bueno
  add column if not exists dream_tags text[],
  add column if not exists dream_note text;

-- dream_mood solo admite 1 o 2 (o null cuando no se registró sueño).
alter table public.sleep_log
  drop constraint if exists sleep_log_dream_mood_check;
alter table public.sleep_log
  add constraint sleep_log_dream_mood_check
  check (dream_mood is null or dream_mood between 1 and 2);
