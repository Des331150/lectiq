-- Add 'error' to the quizzes.status CHECK constraint
-- The API at app/api/quiz/generate/route.ts:96 writes status = 'error' on
-- question generation failure, but the original constraint only allowed
-- ('generating', 'ready', 'completed'). This caused the UPDATE to throw and
-- left failed quizzes stuck in 'generating' indefinitely.

alter table public.quizzes
  drop constraint if exists quizzes_status_check;

alter table public.quizzes
  add constraint quizzes_status_check
  check (status in ('generating', 'ready', 'completed', 'error'));
