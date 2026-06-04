# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the public landing page with the approved Warm Academic visual system.

**Architecture:** Three sequential steps — update CSS color tokens, redesign the page component, verify in browser.

**Tech Stack:** Next.js 16, Tailwind CSS v3, shadcn/ui (slate → warm academic theme)

---

### Task 1: Update color palette in globals.css

**Files:**
- Modify: `app/globals.css:5-27`

- [ ] **Step 1: Replace HSL variables**

Replace the entire `:root` block with Warm Academic palette values:

```css
@layer base {
  :root {
    --background: 40 20% 95%;
    --foreground: 20 15% 12%;
    --card: 40 15% 90%;
    --card-foreground: 20 12% 18%;
    --popover: 40 15% 90%;
    --popover-foreground: 20 12% 18%;
    --primary: 215 40% 17%;
    --primary-foreground: 40 10% 95%;
    --secondary: 40 12% 88%;
    --secondary-foreground: 20 12% 18%;
    --muted: 40 12% 88%;
    --muted-foreground: 35 10% 40%;
    --accent: 30 45% 60%;
    --accent-foreground: 20 15% 12%;
    --destructive: 0 70% 55%;
    --destructive-foreground: 0 0% 98%;
    --border: 40 12% 82%;
    --input: 40 12% 82%;
    --ring: 215 40% 17%;
    --radius: 0.5rem;
  }
}
```

- [ ] **Step 2: Verify in editor**

Check that the file reads valid CSS with all tokens updated. No missing semicolons or brackets.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: update color palette to Warm Academic"
```

---

### Task 2: Redesign landing page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace the entire page component**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-7 py-4 border-b border-border">
        <div className="text-lg font-bold tracking-tight">Lectiq</div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-sm">Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button className="text-sm font-medium">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="flex flex-col md:flex-row gap-10 items-center px-7 py-16 max-w-5xl mx-auto">
          <div className="flex-1">
            <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.15] tracking-tight text-balance mb-4">
              Turn your lecture notes<br />
              <span className="text-[hsl(var(--accent))]">into quizzes</span>
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground max-w-[65ch] mb-7">
              Upload your PDFs and slides. Lectiq extracts the topics and generates
              custom quiz questions — so you can study smarter, not longer.
            </p>
            <div className="flex gap-2.5">
              <Link href="/auth/register">
                <Button size="lg" className="text-sm font-medium px-6 py-3 h-auto">Start Studying Free</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="text-sm font-medium px-6 py-3 h-auto">Sign In</Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="rounded-xl bg-card border border-border h-[220px] flex items-center justify-center text-sm text-muted-foreground border-dashed">
              App Screenshot
            </div>
          </div>
        </div>

        <div className="border-t border-border py-12 px-7">
          <p className="text-center text-xs font-medium uppercase tracking-[1.5px] text-[hsl(var(--accent))] mb-8">
            How it works
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { num: "1", title: "Upload", desc: "Drop your PDF or PowerPoint. We extract the key topics automatically." },
              { num: "2", title: "Generate", desc: "Pick the topics you want to study. Choose MCQ, free response, or both." },
              { num: "3", title: "Learn", desc: "Take the quiz, get AI-graded feedback, and track your progress." },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-base mx-auto mb-3">
                  {step.num}
                </div>
                <h3 className="font-semibold text-base mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px] mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-5 text-center text-sm text-muted-foreground border-t border-border">
        Lectiq — Study smarter
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: redesign landing page with Warm Academic theme"
```

---

### Task 3: Verify

**Files:** none (visual check)

- [ ] **Step 1: Verify dev server renders correctly**

The dev server should already be running. Navigate to `http://localhost:3000/`. Confirm:
- Page loads without errors
- Warm paper background (#F5F2EB) is visible
- Deep navy primary buttons render correctly
- Gold accent on "into quizzes" is visible
- Layout stacks vertically on narrow viewport

- [ ] **Step 2: Check for any visual regressions on the app pages**

Navigate to `/dashboard`, `/auth/login`, etc. — verify the new palette doesn't break existing components. Buttons, cards, and text should all render with the new warm colors.
