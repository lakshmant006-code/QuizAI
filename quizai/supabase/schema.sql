-- ============================================================================
-- QuizAI database schema  (run in Supabase -> SQL Editor -> New query)
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ============================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- documents ----------
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  storage_path text not null,
  page_count   int,
  char_count   int,
  status       text not null default 'uploaded'
               check (status in ('uploaded','processing','ready','failed')),
  error        text,
  created_at   timestamptz not null default now()
);
create index if not exists documents_user_idx on public.documents(user_id, created_at desc);

-- ---------- summaries ----------
create table if not exists public.summaries (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  overview    text not null,
  key_points  jsonb not null default '[]',
  key_terms   jsonb not null default '[]',
  created_at  timestamptz not null default now()
);
create index if not exists summaries_user_idx on public.summaries(user_id, created_at desc);

-- ---------- quizzes ----------
create table if not exists public.quizzes (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete set null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  difficulty  text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  created_at  timestamptz not null default now()
);
create index if not exists quizzes_user_idx on public.quizzes(user_id, created_at desc);

-- ---------- questions ----------
create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references public.quizzes(id) on delete cascade,
  position    int not null default 0,
  kind        text not null check (kind in ('mcq','tf','short')),
  prompt      text not null,
  options     jsonb,
  answer      text not null,
  explanation text
);
create index if not exists questions_quiz_idx on public.questions(quiz_id, position);

-- ---------- quiz_attempts ----------
create table if not exists public.quiz_attempts (
  id         uuid primary key default gen_random_uuid(),
  quiz_id    uuid not null references public.quizzes(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  score      int not null,
  total      int not null,
  answers    jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists attempts_user_idx on public.quiz_attempts(user_id, created_at desc);

-- ---------- tasks (accountability) ----------
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  detail      text,
  done        boolean not null default false,
  starred     boolean not null default false,
  due_at      timestamptz,
  document_id uuid references public.documents(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists tasks_user_idx on public.tasks(user_id, created_at desc);

-- ============================================================================
-- Row-Level Security: every user can only touch their own rows.
-- ============================================================================
alter table public.profiles       enable row level security;
alter table public.documents      enable row level security;
alter table public.summaries      enable row level security;
alter table public.quizzes        enable row level security;
alter table public.questions      enable row level security;
alter table public.quiz_attempts  enable row level security;
alter table public.tasks          enable row level security;

-- profiles
-- Full CRUD on your OWN profile (select / insert / update / delete).
drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile write"  on public.profiles;
drop policy if exists "own profile insert" on public.profiles;
drop policy if exists "own profile all"    on public.profiles;
create policy "own profile all" on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Helper macro pattern: owner-only full access on user_id tables.
do $$
declare t text;
begin
  foreach t in array array['documents','summaries','quizzes','quiz_attempts','tasks']
  loop
    execute format('drop policy if exists "owner all" on public.%I;', t);
    execute format(
      'create policy "owner all" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t);
  end loop;
end $$;

-- questions inherit ownership through their quiz.
drop policy if exists "owner via quiz" on public.questions;
create policy "owner via quiz" on public.questions for all
  using (exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid()))
  with check (exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid()));

-- ============================================================================
-- Storage: private bucket for uploaded PDFs, path-scoped to the owner.
-- Files are stored as  {user_id}/{document_id}.pdf
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', false)
on conflict (id) do nothing;

drop policy if exists "pdf owner read"   on storage.objects;
drop policy if exists "pdf owner write"  on storage.objects;
drop policy if exists "pdf owner delete" on storage.objects;
create policy "pdf owner read" on storage.objects for select
  using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pdf owner write" on storage.objects for insert
  with check (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pdf owner delete" on storage.objects for delete
  using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- Realtime: broadcast row changes so dashboards/analytics update live.
-- ============================================================================
do $$
begin
  perform 1 from pg_publication where pubname = 'supabase_realtime';
  if found then
    alter publication supabase_realtime add table public.documents;
    alter publication supabase_realtime add table public.summaries;
    alter publication supabase_realtime add table public.quizzes;
    alter publication supabase_realtime add table public.quiz_attempts;
    alter publication supabase_realtime add table public.tasks;
  end if;
exception when duplicate_object then
  -- tables already in the publication; ignore.
  null;
end $$;

-- ============================================================================
-- Folders  (iOS-style: drag one file onto another to create a folder)
-- Added after the initial schema — idempotent, safe to run on an existing DB.
-- ============================================================================
create table if not exists public.folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null default 'New Folder',
  created_at timestamptz not null default now()
);
create index if not exists folders_user_idx on public.folders(user_id, created_at desc);

-- A document belongs to at most one folder; deleting a folder frees its files.
alter table public.documents
  add column if not exists folder_id uuid references public.folders(id) on delete set null;
create index if not exists documents_folder_idx on public.documents(folder_id);

alter table public.folders enable row level security;
drop policy if exists "owner all" on public.folders;
create policy "owner all" on public.folders for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime: broadcast folder changes so the files grid updates live.
do $$
begin
  perform 1 from pg_publication where pubname = 'supabase_realtime';
  if found then
    alter publication supabase_realtime add table public.folders;
  end if;
exception when duplicate_object then
  null;
end $$;
