-- ============================================================================
-- 003 — Multi-select ("select all that apply") question kind
-- Run in Supabase -> SQL Editor. Idempotent.
-- ============================================================================
alter table public.questions drop constraint if exists questions_kind_check;
alter table public.questions add constraint questions_kind_check
  check (kind in ('mcq','tf','short','match','order','flashcard','multi'));
