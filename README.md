# Lectiq

Turn lecture slides and PDFs into quizzes. Upload a deck, Lectiq extracts the topics
with an LLM, then generates MCQ and/or free-response questions from the source text
and grades free-response answers against it.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19, Server Actions) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 |
| Backend | Supabase (Postgres, Auth, Storage, RLS) |
| AI | OpenRouter chat completions |
| Package manager | pnpm 10 |

## Requirements

- Node.js 20.9 or newer
- pnpm 10 (`corepack enable pnpm`)
- A Supabase project
- An OpenRouter API key

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```bash
# Supabase — Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase service role key. Bypasses RLS — server-only, never expose to the client.
# Used solely by app/auth/confirm/route.ts to verify email OTP tokens.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter — https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-your-key

# Optional. Defaults to "openrouter/free" (free model router).
# Pin a specific model for consistent output, e.g. "anthropic/claude-sonnet-4".
AI_MODEL=openrouter/free
```

`.env*` is gitignored, so these stay local. Add the same variables to your
deployment platform's environment settings.

### 3. Apply database migrations

The schema lives in `supabase/migrations/` as plain SQL, applied in filename order.

With the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref your-project-ref
supabase db push
```

Or paste each file into the Supabase dashboard SQL editor, in order:

| File | What it does |
|---|---|
| `00001_initial.sql` | Tables (`users`, `documents`, `topics`, `quizzes`, `quiz_questions`, `quiz_answers`, `usage_records`), RLS policies, the private `Documents` storage bucket, and a trigger that creates a `public.users` row on signup |
| `00002_delete_policies.sql` | Delete policies needed for cascading document deletes |
| `00003_quizzes_status_error.sql` | Adds `'error'` to `quizzes.status` so failed generations don't get stuck in `'generating'` |
| `00004_subscription_status_basic.sql` | Introduces the `'basic'` subscription tier |
| `00005_topics_source_content.sql` | Adds `topics.source_content` — verbatim slide text, so questions are generated from real material rather than a summary |
| `00006_documents_processing_warning.sql` | Adds `documents.processing_warnings` for structured truncation notices |
| `00007_drop_subscription_fields.sql` | Removes the now-unused billing columns |
| `00008_quota_and_answer_integrity.sql` | Deduplicates `quiz_answers` and enforces one answer per question; adds the `quota_limits` table plus atomic `claim_quota` / `release_quota` / `record_questions` functions; revokes direct client writes to `usage_records` and `quizzes` |

The `users` table is populated automatically by a `SECURITY DEFINER` trigger on
`auth.users` insert. No backfill needed after signup.

### 4. Configure Supabase Auth

In **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` locally, your production URL when deployed
- **Redirect URLs**: add both
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.com/auth/callback`

Email confirmation links route through `/auth/callback`, which exchanges the code for
a session cookie. Make sure the signup email template points there — the app sends
`emailRedirectTo: ${origin}/auth/callback`.

### 5. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and upload a
PDF or PPTX.

## Scripts

```bash
pnpm dev     # dev server
pnpm build   # production build
pnpm start   # serve the production build
pnpm lint    # eslint
```

## How it works

```
Upload PDF/PPTX
  └─ app/upload/page.tsx          client uploads straight to Supabase Storage
     └─ app/upload/actions.ts     server action: extracts text, calls extractTopics, writes topics
        └─ lib/ai/extract-topics.ts  chunked map → reduce over the document

Generate quiz
  └─ app/documents/[id]/quiz/new/page.tsx   picks topics + format
     └─ app/api/quiz/generate/route.ts      quota check → generateQuestions → persist
        └─ lib/ai/generate-questions.ts    batches topics by char budget, one AI call per batch

Take quiz
  └─ app/quizzes/[id]/page.tsx     renders questions, collects answers
     └─ app/api/quiz/submit/route.ts        MCQ graded directly, free response graded by AI
        └─ lib/ai/grade-answer.ts           scores against the topic's source content
```

### Layout

```
app/                  routes, server actions, API handlers
  api/quiz/           generate + submit endpoints
  auth/               login, register, callback, confirm, logout
  documents/[id]/     topics selection, new quiz
  quizzes/[id]/       take a quiz, view results
components/           UI, incl. ui/ primitives
lib/
  ai/                 client (retry + model), limits, extract/generate/grade
  supabase/           browser, server, admin, and session-refresh clients
  quota.ts            monthly quiz quota
  utils.ts            cn(), month helpers, safeRedirectPath()
supabase/migrations/  schema, applied in filename order
types/                hand-written row types
```

### Extraction and generation limits

Both AI paths are chunked and bounded so a large document can't run away:

| Limit | Value | Where |
|---|---|---|
| PDF pages read | 200 | `app/upload/actions.ts` |
| Topic extraction chunks | 30 × 10,000 chars | `lib/ai/extract-topics.ts` |
| Time budget, extraction | 90s | `lib/ai/extract-topics.ts` |
| Time budget, question gen | 90s | `lib/ai/generate-questions.ts` |
| Max topics per document | 60 | `lib/ai/extract-topics.ts` |
| Questions per AI call | 30,000 chars of source | `lib/ai/generate-questions.ts` |

### Quotas

Monthly caps are **enforced**, not just displayed. Both live in the `quota_limits`
table so the number the dashboard shows is the number the database enforces; change
them with a single `UPDATE`:

```sql
update public.quota_limits set monthly_limit = 25 where kind = 'quiz';
```

| Limit | Default | Enforced by |
|---|---|---|
| Quizzes per month | 10 | `claim_quota('quiz')` in `app/api/quiz/generate/route.ts` |
| Documents per month | 10 | `claim_quota('document')` in `app/upload/actions.ts` |

Quota is claimed atomically before the work starts and **released if that work
fails**, so an errored generation or a scanned PDF doesn't cost the user a credit.
`SUPABASE_SERVICE_ROLE_KEY` is not needed for quota accounting — the security-definer
functions authorise the caller against `auth.uid()` themselves.

When a limit is hit, the reason code is stored in `documents.processing_warnings` and
surfaced on the dashboard card — the document is never silently truncated. Codes are
defined in `lib/ai/limits.ts`.

Failed AI calls are isolated per chunk or per batch, so one bad response doesn't lose
the rest of the document.

### Security notes

- All data access goes through the anon key with RLS enabled, except quiz status
  and score writes (below).
- Every table has a policy scoping rows to `auth.uid()`. Client writes to
  `usage_records` and `quizzes` are revoked entirely — usage counters move only via
  security-definer functions, and a user cannot set their own `score`.
- Quiz `status` and `score` are written via the service-role client in
  `lib/quiz-writes.ts`, since the browser client deliberately has no UPDATE policy
  on `quizzes`. Those queries constrain on `user_id` explicitly, because the service
  role bypasses RLS.
- `uploadDocument` rejects any `filePath` outside the caller's own folder rather than
  relying on storage RLS alone.
- The `Documents` storage bucket is private. Storage policies require the first path
  segment to equal the user's UUID, and files are deleted from storage once topics are
  extracted — only the derived text is retained. Failed uploads are cleaned up too.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It is read only in `lib/quiz-writes.ts`;
  keep it server-only.
- Auth-gated routes are enforced in `lib/supabase/session.ts` via `proxy.ts`, with a
  per-page check as a second layer.

## Deployment

Vercel works out of the box — `vercel.json` pins `pnpm install`.

Add all five environment variables in the project settings. Two things to watch:

- **Function duration.** Extraction and generation budgets are 90s. If your plan's
  function timeout is shorter, large uploads will 504. Raise `maxDuration` on the
  relevant routes or the plan's limit.
- **Auth redirect URLs.** Add your production `/auth/callback` URL in Supabase Auth
  settings, or email confirmation will fail in production.

## Known issues

Remaining, after the fixes in migration 00008:

- **Generation still blocks the request.** The generate endpoint runs the AI work
  inline and `maxDuration = 300` is set on it, but a large deck can still come close to
  that ceiling. The real fix is a background job with the client polling a status
  column — the `generating` state and the polling loop in `app/quizzes/[id]/page.tsx`
  are already there waiting for it.
- **`types/database.ts` is unenforced.** The Supabase clients aren't generic, so every
  `.from()` still returns `any` and the row types are documentation rather than
  guarantees. Generating them from the schema (`supabase gen types`) would make future
  drift a compile error.
- **Failed uploads leave an `error`-status document row** with no way to retry it from
  the dashboard. The spinner no longer hangs, but cleanup is manual.
- **No tests.** `parseTopics` in `lib/ai/extract-topics.ts` and the score calculation in
  `app/api/quiz/submit/route.ts` are the two highest-value things to cover first.

Resolved:

- Resubmitting a quiz no longer inflates the score — one answer per question, enforced
  by a unique index, replaced rather than appended.
- Both monthly caps are enforced atomically and released on failure.
- Clients can no longer write `usage_records` or `quizzes.score` directly.
- Request bodies are validated; bad input returns 400 instead of a generic 500.
- Polling stops on `error`, so failed documents and quizzes no longer spin forever.
- `app/auth/confirm` now establishes a session instead of redirecting unauthenticated.
- Dead `logout`/`signout` routes removed.

## Conventions

`PRODUCT.md` and `DESIGN.md` define product intent and the visual system — read them
before changing copy or styling. Design tokens are CSS custom properties in
`app/globals.css`, mapped in `tailwind.config.ts`.
