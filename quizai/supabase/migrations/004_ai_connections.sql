-- Per-user "bring your own model" connection: an OpenAI-compatible local/self-
-- hosted AI server the user's browser calls directly to generate quizzes.
-- One row per user. RLS: each user manages only their own connection.
create table if not exists public.ai_connections (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  base_url   text not null,           -- e.g. http://localhost:1234/v1
  model      text not null,           -- e.g. llama-3.1-8b-instruct
  api_key    text,                    -- optional; often unused for local servers
  updated_at timestamptz not null default now()
);

alter table public.ai_connections enable row level security;

drop policy if exists "own ai connection" on public.ai_connections;
create policy "own ai connection" on public.ai_connections
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
