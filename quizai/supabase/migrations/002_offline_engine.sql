-- ============================================================================
-- 002 — Offline quiz engine support
-- Run in Supabase -> SQL Editor. Idempotent; safe to re-run.
-- ============================================================================

-- New question kinds produced by the offline models.
alter table public.questions drop constraint if exists questions_kind_check;
alter table public.questions add constraint questions_kind_check
  check (kind in ('mcq','tf','short','match','order','flashcard'));

-- Which of the 10 offline models produced this question (null for AI quizzes).
alter table public.questions add column if not exists model text;

-- How a quiz was made: 'ai' (Claude) or 'offline' (the engine).
alter table public.quizzes add column if not exists source text not null default 'ai';

-- Per-user thumbs up / down for each of the 10 quiz models.
create table if not exists public.model_ratings (
  user_id    uuid not null references auth.users(id) on delete cascade,
  model      text not null,
  rating     smallint not null check (rating in (-1, 1)),
  updated_at timestamptz not null default now(),
  primary key (user_id, model)
);

alter table public.model_ratings enable row level security;
drop policy if exists "own ratings" on public.model_ratings;
create policy "own ratings" on public.model_ratings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
