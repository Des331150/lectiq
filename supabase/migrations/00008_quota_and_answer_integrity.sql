-- Two integrity fixes for quiz scoring and quota accounting.
--
-- 1. quiz_answers gained no uniqueness on question_id, and
--    app/api/quiz/submit/route.ts inserted a fresh row per submission before
--    scoring across every row for those questions. Submitting a quiz twice
--    therefore duplicated rows, skewed the score, and left the results page
--    rendering the oldest attempt (it reads the first matching row). One answer
--    per question, overwritten on resubmit, removes all three failure modes.
--
-- 2. Quota counters were read-then-written from application code, so concurrent
--    requests could both pass the check and exceed the monthly cap, and the
--    first write of a new month could collide on unique(user_id, month). These
--    functions make claim/release a single atomic statement. The SQL constants
--    are the source of truth for the limits; lib/quota.ts reads them back via
--    the limits table rather than hardcoding a second copy.

-- Keep the most recent answer per question, discard older duplicates.
delete from public.quiz_answers a
using public.quiz_answers b
where a.question_id = b.question_id
  and (a.created_at, a.id) < (b.created_at, b.id);

create unique index if not exists quiz_answers_question_id_key
  on public.quiz_answers (question_id);

-- Monthly limits, single source of truth shared with the application.
create table if not exists public.quota_limits (
  kind text primary key check (kind in ('quiz', 'document')),
  monthly_limit int not null check (monthly_limit > 0)
);

insert into public.quota_limits (kind, monthly_limit)
values ('quiz', 10), ('document', 10)
on conflict (kind) do update set monthly_limit = excluded.monthly_limit;

alter table public.quota_limits enable row level security;

create policy "Anyone can read quota limits"
  on public.quota_limits for select
  using (true);

-- Atomically claim one unit of quota for the month. Returns false when the
-- claim would exceed the monthly limit, having rolled its own increment back.
create or replace function public.claim_quota(
  p_user_id uuid,
  p_month text,
  p_kind text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit int;
  v_count int;
begin
  -- SECURITY DEFINER bypasses RLS, so authorise explicitly: a caller may only
  -- ever claim against its own uid.
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select monthly_limit into v_limit
  from public.quota_limits
  where kind = p_kind;

  if v_limit is null then
    raise exception 'unknown quota kind: %', p_kind;
  end if;

  -- Constrain the month to YYYY-MM so a malformed value can't create a junk
  -- usage_records row that silently diverges from the real billing period.
  if p_month is null or p_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception 'invalid month: %', p_month;
  end if;

  insert into public.usage_records as u (user_id, month, quizzes_used, documents_uploaded)
  values (
    p_user_id,
    p_month,
    case when p_kind = 'quiz' then 1 else 0 end,
    case when p_kind = 'document' then 1 else 0 end
  )
  on conflict (user_id, month) do update
    set quizzes_used = case when p_kind = 'quiz' then u.quizzes_used + 1 else u.quizzes_used end,
        documents_uploaded = case when p_kind = 'document' then u.documents_uploaded + 1 else u.documents_uploaded end
  returning case when p_kind = 'quiz' then quizzes_used else documents_uploaded end
    into v_count;

  if v_count > v_limit then
    update public.usage_records
       set quizzes_used = case when p_kind = 'quiz' then quizzes_used - 1 else quizzes_used end,
           documents_uploaded = case when p_kind = 'document' then documents_uploaded - 1 else documents_uploaded end
     where user_id = p_user_id and month = p_month;
    return false;
  end if;

  return true;
end;
$$;

-- Give a claimed unit back. Called when the work that consumed it fails, so a
-- failed generation or upload is not billed against the monthly cap.
create or replace function public.release_quota(
  p_user_id uuid,
  p_month text,
  p_kind text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_month is null or p_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception 'invalid month: %', p_month;
  end if;

  update public.usage_records
     set quizzes_used = greatest(quizzes_used - (case when p_kind = 'quiz' then 1 else 0 end), 0),
         documents_uploaded = greatest(documents_uploaded - (case when p_kind = 'document' then 1 else 0 end), 0)
   where user_id = p_user_id and month = p_month;
end;
$$;

-- Record questions produced by a quiz that already holds a claimed unit.
create or replace function public.record_questions(
  p_user_id uuid,
  p_month text,
  p_count int
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.usage_records
     set questions_generated = questions_generated + greatest(p_count, 0)
   where user_id = p_user_id and month = p_month;
end;
$$;

revoke all on function public.claim_quota(uuid, text, text) from public;
revoke all on function public.release_quota(uuid, text, text) from public;
revoke all on function public.record_questions(uuid, text, int) from public;

grant execute on function public.claim_quota(uuid, text, text) to authenticated;
grant execute on function public.release_quota(uuid, text, text) to authenticated;
grant execute on function public.record_questions(uuid, text, int) to authenticated;

-- Quota counters are now written exclusively by the security-definer functions
-- above. Leaving the direct-write policies in place would let the browser client
-- forge usage_records rows and so defeat the caps entirely.
drop policy if exists "Users can insert own usage records" on public.usage_records;
drop policy if exists "Users can update own usage records" on public.usage_records;

-- Same problem on quizzes: the blanket CRUD policy let a signed-in user UPDATE
-- their own quiz, including `score` and `status`, straight from the browser.
-- Narrow it to the operations a client legitimately needs. The server routes
-- write status/score through the service-role admin client.
drop policy if exists "Users can CRUD own quizzes" on public.quizzes;

create policy "Users can read own quizzes"
  on public.quizzes for select
  using (auth.uid() = user_id);

create policy "Users can insert own quizzes"
  on public.quizzes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own quizzes"
  on public.quizzes for delete
  using (auth.uid() = user_id);