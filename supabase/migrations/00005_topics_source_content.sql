-- Store the verbatim source text each topic was extracted from so question
-- generation can use the full lecture material instead of a short summary.
alter table public.topics
  add column if not exists source_content text;
