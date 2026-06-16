# Pricing Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public pricing section to the landing page and update the billing page with a Basic ($7.99/mo, $69.99/yr) and Pro ($14.99/mo, $129.99/yr) two-tier model.

**Architecture:** Landing page gets a new pricing section component between "How it works" and the footer. Billing page gets a monthly/annual toggle and Basic/Pro cards with Stripe checkout links. Backend changes: subscription_status expands to "basic"|"pro", quota logic drops document limits, Stripe gets two price IDs per plan.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS, Stripe, Supabase, lucide-react

---

### Task 1: Update database types and backend logic

**Files:**
- Modify: `types/database.ts:5`
- Modify: `lib/quota.ts`
- Modify: `app/api/webhooks/stripe/route.ts`
- Modify: `app/dashboard/page.tsx:77`

- [ ] **Step 1: Update subscription_status type**

```typescript
// types/database.ts — change line 5
export interface User {
  id: string;
  email: string | null;
  stripe_customer_id: string | null;
  subscription_status: "basic" | "pro";
  quiz_quota_reset_at: string;
  created_at: string;
}
```

- [ ] **Step 2: Update quota logic — remove document limits, update quiz check**

```typescript
// lib/quota.ts — full replace
import { createServerSupabaseClient } from "./supabase/server";
import { getCurrentMonth } from "./utils";

export async function checkUploadQuota(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  return { allowed: true };
}

export async function checkQuizQuota(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await createServerSupabaseClient();
  const month = getCurrentMonth();

  const { data: user } = await supabase
    .from("users")
    .select("subscription_status")
    .eq("id", userId)
    .single();

  if (user?.subscription_status === "pro") {
    return { allowed: true };
  }

  const { data: usage } = await supabase
    .from("usage_records")
    .select("quizzes_used")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  if (usage && usage.quizzes_used >= 10) {
    return { allowed: false, reason: "Basic plan limited to 10 quizzes per month. Upgrade to Pro for unlimited quizzes." };
  }

  return { allowed: true };
}
```

- [ ] **Step 3: Update Stripe webhook — replace "free" with "basic"**

```typescript
// app/api/webhooks/stripe/route.ts — change line 27
subscription_status: "pro"

// change line 44
.update({ subscription_status: isActive ? "pro" : "basic" })
```

- [ ] **Step 4: Update dashboard text**

```typescript
// app/dashboard/page.tsx — line 77, change "Free plan" to "Basic plan"
```

- [ ] **Step 5: Commit**

```bash
git add types/database.ts lib/quota.ts app/api/webhooks/stripe/route.ts app/dashboard/page.tsx
git commit -m "feat: update subscription model to basic/pro with document limit removal"
```

---

### Task 2: Update Stripe integration

**Files:**
- Modify: `lib/stripe.ts`

- [ ] **Step 1: Add price IDs and update checkout function**

```typescript
// lib/stripe.ts — full replace
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24" as any,
      typescript: true,
    });
  }
  return _stripe;
}

export const BASIC_PRICE_ID_MONTHLY = "price_basic_monthly";
export const BASIC_PRICE_ID_YEARLY = "price_basic_yearly";
export const PRO_PRICE_ID_MONTHLY = "price_pro_monthly";
export const PRO_PRICE_ID_YEARLY = "price_pro_yearly";

const PRICE_IDS: Record<string, Record<string, string>> = {
  basic: { monthly: BASIC_PRICE_ID_MONTHLY, yearly: BASIC_PRICE_ID_YEARLY },
  pro: { monthly: PRO_PRICE_ID_MONTHLY, yearly: PRO_PRICE_ID_YEARLY },
};

export function getPriceId(plan: "basic" | "pro", interval: "monthly" | "yearly"): string {
  return PRICE_IDS[plan][interval];
}

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  plan: "basic" | "pro",
  interval: "monthly" | "yearly" = "monthly"
) {
  const priceId = getPriceId(plan, interval);
  return await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: userEmail,
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    metadata: { userId, plan },
  });
}

export async function createPortalSession(customerId: string) {
  return await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/stripe.ts
git commit -m "feat: add basic/pro price IDs and interval-aware checkout"
```

---

### Task 3: Update authenticated billing page

**Files:**
- Create: `components/billing-toggle.tsx`
- Modify: `app/billing/page.tsx`

- [ ] **Step 1: Create BillingToggle component**

```typescript
// components/billing-toggle.tsx
import Link from "next/link";

export function BillingToggle({ interval }: { interval: "monthly" | "yearly" }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <Link
        href="/billing"
        className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
          interval === "monthly"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Monthly
      </Link>
      <Link
        href="/billing?interval=yearly"
        className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
          interval === "yearly"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Annual
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite billing page with Basic/Pro cards**

```typescript
// app/billing/page.tsx — full replace
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Check } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createCheckoutSession, getStripe } from "@/lib/stripe";
import { BillingToggle } from "@/components/billing-toggle";

export const dynamic = "force-dynamic";

export default async function BillingPage(props: {
  searchParams: Promise<{ interval?: string }>;
}) {
  const searchParams = await props.searchParams;
  const isYearly = searchParams.interval === "yearly";
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const currentPlan = userData?.subscription_status || "basic";

  const plans = [
    {
      id: "basic",
      name: "Basic",
      monthly: { price: "$7.99", label: "/month" },
      yearly: { price: "$69.99", label: "/yr" },
      features: [
        "10 quizzes per month",
        "MCQ + Free Response questions",
        "AI-graded feedback",
        "PDF export",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      monthly: { price: "$14.99", label: "/month" },
      yearly: { price: "$129.99", label: "/yr" },
      features: [
        "Unlimited quizzes (fair use)",
        "MCQ + Free Response questions",
        "AI-graded feedback",
        "All export formats (coming)",
      ],
      popular: true,
    },
  ];

  async function checkoutAction(formData: FormData) {
    "use server";
    const plan = formData.get("plan") as string;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new Error("Not authenticated");
    const session = await createCheckoutSession(
      user.id,
      user.email,
      plan as "basic" | "pro",
      isYearly ? "yearly" : "monthly"
    );
    redirect(session.url!);
  }

  return (
    <AppShell title="Billing">
      <h1 className="text-2xl font-bold mb-2">Billing</h1>
      <p className="text-muted-foreground mb-8">Manage your subscription</p>

      <BillingToggle interval={isYearly ? "yearly" : "monthly"} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const pricing = isYearly ? plan.yearly : plan.monthly;

          return (
            <div
              key={plan.id}
              className={`relative rounded-lg border p-6 ${
                isCurrent ? "ring-2 ring-primary" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-medium uppercase tracking-wide bg-accent text-accent-foreground px-3 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <h2 className="text-lg font-bold mb-1">{plan.name}</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">
                {plan.id === "basic" ? "For getting started" : "For power learners"}
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold">{pricing.price}</span>
                <span className="text-sm text-muted-foreground ml-1">{pricing.label}</span>
                {isYearly && (
                  <span className="ml-2 text-xs text-green-700 font-medium">
                    Save {plan.id === "basic" ? "27" : "28"}%
                  </span>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <p className="text-sm text-muted-foreground text-center pt-1">Current plan</p>
              ) : (
                <form action={checkoutAction}>
                  <input type="hidden" name="plan" value={plan.id} />
                  <button
                    type="submit"
                    className={`w-full rounded-lg py-2 text-sm font-medium text-center ${
                      plan.popular
                        ? "bg-primary text-primary-foreground"
                        : "border border-primary text-foreground"
                    }`}
                  >
                    {plan.id === "pro" ? "Go Pro" : "Get Basic"}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/billing/page.tsx components/billing-toggle.tsx
git commit -m "feat: update billing page with basic/pro plans and interval toggle"
```

---

### Task 4: Add pricing section to landing page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add pricing section between "How it works" and footer**

In `app/page.tsx`, after the "How it works" section (`</div>` closing the grid + `</div>` closing the section wrapper, around line 71), insert:

```typescript
<div className="border-t border-border py-12 px-4 sm:px-6">
  <h2 className="text-center text-xs font-medium uppercase tracking-[1.5px] text-accent mb-2">
    Pricing
  </h2>
  <p className="text-center text-muted-foreground text-sm mb-8">
    Start with Basic. Upgrade when you need more.
  </p>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
    {/* Basic card */}
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-lg font-bold mb-1">Basic</h3>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">
        For getting started
      </p>
      <div className="mb-4">
        <span className="text-3xl font-bold">$7.99</span>
        <span className="text-sm text-muted-foreground ml-1">/month</span>
        <div className="text-xs text-muted-foreground">or $69.99 /year <span className="text-green-700 font-medium">Save 27%</span></div>
      </div>
      <ul className="space-y-2 mb-6">
        <li className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          10 quizzes per month
        </li>
        <li className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          MCQ + Free Response
        </li>
        <li className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          AI-graded feedback
        </li>
        <li className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          PDF export
        </li>
      </ul>
      <Link href="/auth/register">
        <Button className="w-full font-medium">Get Basic</Button>
      </Link>
    </div>

    {/* Pro card */}
    <div className="rounded-lg border border-border bg-card p-6 relative ring-2 ring-primary">
      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-medium uppercase tracking-wide bg-accent text-accent-foreground px-3 py-0.5 rounded-full">
        Popular
      </span>
      <h3 className="text-lg font-bold mb-1">Pro</h3>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">
        For power learners
      </p>
      <div className="mb-4">
        <span className="text-3xl font-bold">$14.99</span>
        <span className="text-sm text-muted-foreground ml-1">/month</span>
        <div className="text-xs text-muted-foreground">or $129.99 /year <span className="text-green-700 font-medium">Save 28%</span></div>
      </div>
      <ul className="space-y-2 mb-6">
        <li className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          Unlimited quizzes (fair use)
        </li>
        <li className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          MCQ + Free Response
        </li>
        <li className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          AI-graded feedback
        </li>
        <li className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          All export formats (coming)
        </li>
      </ul>
      <Link href="/auth/register">
        <Button variant="outline" className="w-full font-medium">Go Pro</Button>
      </Link>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add pricing section to landing page"
```
