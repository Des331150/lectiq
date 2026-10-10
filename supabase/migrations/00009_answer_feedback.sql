-- Feedback that explains *why* an answer was wrong, and cites the source.
--
-- The results page could previously only say "you picked B, it was A" for
-- multiple choice: quiz_questions stored the options and the correct label but
-- nothing explaining the reasoning. Free response had ai_feedback, but it was a
-- single free-text blob and the grader already had the source context in hand
-- without recording which sentence justified the grade.
--
-- These columns let the results page show a misconception-level explanation and
-- the line of the student's own document that settles it.
--
-- All columns are nullable on purpose. Rows generated before this migration
-- have no explanation, and the UI degrades to showing the correct answer
-- without a "why" block rather than rendering an empty section.

-- Why the correct answer is correct. Generated with the question, so it costs
-- no extra AI call.
alter table public.quiz_questions
  add column if not exists explanation text;

-- The verbatim sentence from the topic that justifies the grade.
alter table public.quiz_answers
  add column if not exists source_quote text;

-- ai_feedback stays for the existing single-blob case; these split the grade
-- into credit and gap so the UI can label them separately instead of parsing
-- prose. what_was_missing is null for a fully correct answer.
alter table public.quiz_answers
  add column if not exists what_was_right text;

alter table public.quiz_answers
  add column if not exists what_was_missing text;