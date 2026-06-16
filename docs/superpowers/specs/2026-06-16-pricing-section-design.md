# Pricing Section Design

**Date:** 2026-06-16
**Status:** Implemented

## Summary

Add a public-facing pricing section to the landing page and revamp the authenticated billing page to support a two-tier paid model (Basic + Pro) with monthly and annual billing, replacing the existing Free/Pro structure.

## Pricing

| | Basic | Pro |
|---|---|---|
| Monthly | $7.99/mo | $14.99/mo |
| Annual | $69.99/yr ($5.83/mo) | $129.99/yr ($10.83/mo) |
| Quizzes | 10/month | Unlimited (fair use) |
| Question types | MCQ + Free Response | MCQ + Free Response |
| Export | PDF | PDF + more formats (coming) |

No free tier. No document limits. No undefined features (faster queue, priority support) in the initial launch.

## Changes Made

### 1. Landing page (`app/page.tsx`)

Pricing section between "How it works" and footer with:
- Section heading: uppercase "Pricing" label in accent gold
- Two cards (Basic / Pro) with feature lists, prices, CTA buttons
- Pro card has "Popular" badge and `ring-2 ring-primary`
- Annual pricing shown below monthly with "Save X%" callout

### 2. Billing page (`app/billing/page.tsx`)

Client component with:
- Reads current plan from Supabase
- Monthly/Annual toggle via `BillingToggle` component
- Basic/Pro pricing cards with "Current plan" / "Go Pro" / "Get Basic" buttons
- Server action `checkoutAction` in `app/billing/actions.ts`
- Redirects to Stripe checkout on success
- Error state display

### 3. Database migration

`supabase/migrations/00004_subscription_status_basic.sql`:
- Changes `subscription_status` check constraint from `('free', 'pro')` to `('basic', 'pro')`
- Updates existing `'free'` rows to `'basic'`
- Changes default from `'free'` to `'basic'`

### 4. Quota logic (`lib/quota.ts`)

- `checkUploadQuota`: Always returns `{ allowed: true }` (no document limits)
- `checkQuizQuota`: Pro = unlimited, Basic = 10/month

### 5. Stripe (`lib/stripe.ts`)

- 4 price ID constants: basic monthly/yearly, pro monthly/yearly
- `getPriceId(plan, interval)` helper
- `createCheckoutSession(userId, email, plan, interval)` with plan in metadata

### 6. Webhook (`app/api/webhooks/stripe/route.ts`)

- Cancelled/deactivated subscriptions set status to `"basic"` instead of `"free"`

## Out of Scope (deferred)

- Faster generation queue
- Priority support
- Additional export formats (label set, implementation deferred)
- Dark mode
