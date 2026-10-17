# Tests

Two tiers, split by what they need.

## `pnpm test` — unit

Pure logic, no server and no database. Runs in about a second.

```bash
pnpm test
```

Node 26 strips the TypeScript types natively, so these import the `lib/*.ts`
files directly with no build step.

## `pnpm test:browser` — rendered behaviour

Drives a running dev server with Playwright. Start `pnpm dev` first.

```bash
pnpm dev            # in one terminal
pnpm test:browser   # in another
```

Each test skips itself when the server is not reachable, so it fails loudly on a
real defect but does not go red on a fresh checkout for the wrong reason.

No Supabase credentials are required. The tests cover signed-out screens and
structural rules only.

The suite warms every route it visits before running. A dev server compiles a
route and its client bundle on first request, which takes longer than any
per-test budget and lands as a spurious failure on whichever test arrived first.
The warm-up pass moves that cost out of the measurements.

## What these guard

Every test here corresponds to a defect that `tsc`, `eslint` and `next build`
all passed, and that only a rendered page or a specific input exposed.

| Area | Regression it prevents |
|---|---|
| `tests/unit/upload-types.test.ts` | A `.docx` renamed to `.pdf` being accepted because the MIME type said PDF. |
| `tests/unit/auth-errors.test.ts` | Signup telling an anonymous visitor that an address is registered. |
| `tests/unit/review.test.ts` | A weak free-response answer filed under "correct" because the threshold sat too low. |
| `tests/unit/lib.test.ts` | An open redirect, raw enum values leaking into copy, the extraction cap overtaking the request cap. |
| `tests/browser/behaviour.test.mjs` | Provider wording reaching the UI, dead footer links, a button nested in an anchor, a marketing tile rendering too small to read. |

## Two notes for anyone adding tests

**Match a live region inside its container.** Next injects its own route
announcer with `role="alert"`, so `page.locator('[role="alert"]')` matches an
empty node and passes on nothing. Scope to the form:
`page.locator("form [role='alert']")`.

**Use a syntactically valid email.** `nobody-at-lectiq.invalid` has no `@`, so
native constraint validation blocks the submit event before React sees it and
the test fails for a reason that has nothing to do with the code under test.

**Wait on the condition, not on a clock.** A `waitForTimeout` after an action is
a race against compile time and network. Wait for the thing being asserted.

## CI

`.github/workflows/ci.yml` runs typecheck, lint, unit tests and build in one
job, then the browser tests in a second job against a dev server started with
placeholder Supabase credentials. Nothing in CI needs a database or a secret.