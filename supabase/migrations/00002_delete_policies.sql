-- Add DELETE policies for quiz_questions and quiz_answers
-- These are needed for cascading deletes when a document is removed

create policy "Users can delete own quiz questions"
  on public.quiz_questions for delete
  using (
    exists (
      select 1 from public.quizzes
      where quizzes.id = quiz_questions.quiz_id
      and quizzes.user_id = auth.uid()
    )
  );

create policy "Users can delete own quiz answers"
  on public.quiz_answers for delete
  using (
    exists (
      select 1 from public.quiz_questions
      join public.quizzes on quizzes.id = quiz_questions.quiz_id
      where quiz_questions.id = quiz_answers.question_id
      and quizzes.user_id = auth.uid()
    )
  );
