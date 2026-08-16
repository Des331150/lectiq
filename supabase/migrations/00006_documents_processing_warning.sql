-- Allow documents to surface non-fatal processing warnings as structured
-- reason codes (see lib/ai/limits.ts) instead of silently dropping material
-- or flattening distinct truncation causes into one prose string.
alter table public.documents add column if not exists processing_warnings text[];