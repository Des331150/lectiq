-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (managed by Supabase Auth, extended with subscription data)
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  stripe_customer_id text,
  subscription_status text not null default 'free' check (subscription_status in ('free', 'pro')),
  quiz_quota_reset_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own data"
  on public.users for select
  using (auth.uid() = id);

-- Documents
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  file_path text not null,
  file_type text not null check (file_type in ('pdf', 'pptx')),
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  page_count int,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Users can CRUD own documents"
  on public.documents for all
  using (auth.uid() = user_id);

create index documents_user_id_idx on public.documents(user_id);

-- Topics
create table public.topics (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.documents(id) on delete cascade,
  title text not null,
  content text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.topics enable row level security;

create policy "Users can read own document topics"
  on public.topics for select
  using (
    exists (
      select 1 from public.documents
      where documents.id = topics.document_id
      and documents.user_id = auth.uid()
    )
  );

create policy "Users can insert own document topics"
  on public.topics for insert
  with check (
    exists (
      select 1 from public.documents
      where documents.id = topics.document_id
      and documents.user_id = auth.uid()
    )
  );

create index topics_document_id_idx on public.topics(document_id);

-- Quizzes
create table public.quizzes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  format text not null check (format in ('mcq', 'free_response', 'both')),
  status text not null default 'generating' check (status in ('generating', 'ready', 'completed')),
  question_count int not null default 0,
  score numeric,
  created_at timestamptz not null default now()
);

alter table public.quizzes enable row level security;

create policy "Users can CRUD own quizzes"
  on public.quizzes for all
  using (auth.uid() = user_id);

create index quizzes_user_id_idx on public.quizzes(user_id);
create index quizzes_document_id_idx on public.quizzes(document_id);

-- Quiz Questions
create table public.quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  type text not null check (type in ('mcq', 'free_response')),
  question_text text not null,
  options jsonb,
  correct_answer text,
  model_answer text,
  topic_id uuid references public.topics(id),
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.quiz_questions enable row level security;

create policy "Users can read own quiz questions"
  on public.quiz_questions for select
  using (
    exists (
      select 1 from public.quizzes
      where quizzes.id = quiz_questions.quiz_id
      and quizzes.user_id = auth.uid()
    )
  );

create policy "Users can insert own quiz questions"
  on public.quiz_questions for insert
  with check (
    exists (
      select 1 from public.quizzes
      where quizzes.id = quiz_questions.quiz_id
      and quizzes.user_id = auth.uid()
    )
  );

create index quiz_questions_quiz_id_idx on public.quiz_questions(quiz_id);

-- Quiz Answers
create table public.quiz_answers (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  user_answer text not null,
  is_correct boolean,
  ai_score int,
  ai_feedback text,
  created_at timestamptz not null default now()
);

alter table public.quiz_answers enable row level security;

create policy "Users can read own quiz answers"
  on public.quiz_answers for select
  using (
    exists (
      select 1 from public.quiz_questions
      join public.quizzes on quizzes.id = quiz_questions.quiz_id
      where quiz_questions.id = quiz_answers.question_id
      and quizzes.user_id = auth.uid()
    )
  );

create policy "Users can insert own quiz answers"
  on public.quiz_answers for insert
  with check (
    exists (
      select 1 from public.quiz_questions
      join public.quizzes on quizzes.id = quiz_questions.quiz_id
      where quiz_questions.id = quiz_answers.question_id
      and quizzes.user_id = auth.uid()
    )
  );

create index quiz_answers_question_id_idx on public.quiz_answers(question_id);

-- Usage Records
create table public.usage_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  month text not null,
  quizzes_used int not null default 0,
  documents_uploaded int not null default 0,
  questions_generated int not null default 0,
  unique(user_id, month)
);

alter table public.usage_records enable row level security;

create policy "Users can read own usage records"
  on public.usage_records for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage records"
  on public.usage_records for insert
  with check (auth.uid() = user_id);

create policy "Users can update own usage records"
  on public.usage_records for update
  using (auth.uid() = user_id);

create index usage_records_user_id_idx on public.usage_records(user_id);

-- Auto-create user record on signup
-- Create documents storage bucket
insert into storage.buckets (id, name, public)
values ('Documents', 'Documents', false)
on conflict (id) do nothing;

-- Storage RLS for documents bucket
create policy "Users can upload own files"
  on storage.objects for insert
  with check (
    bucket_id = 'Documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own files"
  on storage.objects for select
  using (
    bucket_id = 'Documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own files"
  on storage.objects for update
  using (
    bucket_id = 'Documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'Documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
