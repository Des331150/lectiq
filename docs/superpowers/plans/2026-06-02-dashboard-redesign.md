# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the dashboard top nav with a sidebar, update stats to 4 columns, add a topics total stat, include logout.

**Architecture:** Create a shared `Sidebar` component, update `DashboardStats` to 4 columns with topics, update `DocumentCard` styling, update the dashboard page.

**Tech Stack:** Next.js 16, Tailwind CSS v3, shadcn/ui, Warm Academic theme

---

### Task 1: Create logout route

**Files:**
- Create: `app/auth/logout/route.ts`

- [ ] **Step 1: Write the route handler**

Create `app/auth/logout/route.ts`:

```tsx
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url));
}
```

Note: `request` is not defined in this scope. Fix:

```tsx
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url));
}
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/logout/route.ts
git commit -m "feat: add logout route"
```

---

### Task 2: Create Sidebar component

**Files:**
- Create: `components/sidebar.tsx`

- [ ] **Step 1: Write the component**

Create `components/sidebar.tsx` with a dark navy sidebar, nav links, logout action:

```tsx
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function Sidebar() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const email = user.email || "";
  const initial = email.charAt(0).toUpperCase() || "U";

  return (
    <aside className="w-52 shrink-0 bg-[#1B2A3B] text-[#F5F2EB] flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-white/10">
        <Link href="/dashboard" className="font-bold text-base tracking-tight">
          Lectiq
        </Link>
      </div>

      <nav className="flex-1 py-4 space-y-0.5">
        <SidebarLink href="/dashboard" label="Dashboard" />
        <SidebarLink href="/upload" label="Upload" />
        <SidebarLink href="/history" label="History" />
        <SidebarLink href="/billing" label="Billing" />
      </nav>

      <div className="px-4 py-4 border-t border-white/10 space-y-3">
        <p className="text-xs text-white/50 truncate">{email}</p>
        <form action="/auth/logout" method="post">
          <button type="submit" className="text-xs text-white/50 hover:text-white/80 transition-colors">
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}

interface SidebarLinkProps {
  href: string;
  label: string;
}

function SidebarLink({ href, label }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
    >
      {label}
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sidebar.tsx
git commit -m "feat: add Sidebar component with nav and logout"
```

---

### Task 2: Update DashboardStats to 4 columns

**Files:**
- Modify: `components/dashboard-stats.tsx`

- [ ] **Step 1: Replace the component**

Add `topicsExtracted` to the props, change to 4-column grid:

```tsx
interface DashboardStatsProps {
  documentsUsed: number;
  documentsLimit: number;
  quizzesUsed: number;
  quizzesLimit: number;
  averageScore: number | null;
  topicsExtracted: number;
  isPro: boolean;
}

export function DashboardStats({
  documentsUsed,
  documentsLimit,
  quizzesUsed,
  quizzesLimit,
  averageScore,
  topicsExtracted,
  isPro,
}: DashboardStatsProps) {
  const quizPct = Math.min((quizzesUsed / quizzesLimit) * 100, 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-lg border border-border bg-white p-4">
        <p className="text-xs uppercase tracking-[1px] text-muted-foreground mb-0.5">Documents</p>
        <p className="text-[28px] font-bold text-primary">
          {documentsUsed}
          {!isPro && <span className="text-base font-normal text-muted-foreground"> / {documentsLimit}</span>}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-white p-4">
        <p className="text-xs uppercase tracking-[1px] text-muted-foreground mb-0.5">Quizzes Taken</p>
        <p className="text-[28px] font-bold text-primary">
          {quizzesUsed}
          {!isPro && <span className="text-base font-normal text-muted-foreground"> / {quizzesLimit}</span>}
        </p>
        {!isPro && (
          <div className="w-full h-1 bg-muted rounded-full mt-1.5">
            <div className="h-full bg-accent rounded-full" style={{ width: `${quizPct}%` }} />
          </div>
        )}
      </div>
      <div className="rounded-lg border border-border bg-white p-4">
        <p className="text-xs uppercase tracking-[1px] text-muted-foreground mb-0.5">Avg Score</p>
        <p className="text-[28px] font-bold text-primary">
          {averageScore !== null ? `${Math.round(averageScore)}%` : "\u2014"}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-white p-4">
        <p className="text-xs uppercase tracking-[1px] text-muted-foreground mb-0.5">Topics Extracted</p>
        <p className="text-[28px] font-bold text-primary">{topicsExtracted}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard-stats.tsx
git commit -m "feat: update DashboardStats to 4 columns with topics stat"
```

---

### Task 3: Update DocumentCard styling

**Files:**
- Modify: `components/document-card.tsx`

- [ ] **Step 1: Replace the component**

```tsx
import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Document } from "@/types/database";

interface DocumentCardProps {
  document: Document;
  topicCount: number;
  quizCount: number;
}

export function DocumentCard({ document, topicCount, quizCount }: DocumentCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-white p-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{document.title}</p>
          <p className="text-xs text-muted-foreground">
            {topicCount} topic{topicCount !== 1 ? "s" : ""} &middot; {quizCount} quiz{quizCount !== 1 ? "zes" : ""}
          </p>
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <Link href={`/documents/${document.id}/topics`}>
          <Button variant="outline" size="sm" className="text-xs h-7 px-3">Topics</Button>
        </Link>
        <Link href={`/documents/${document.id}/quiz/new`}>
          <Button size="sm" className="text-xs h-7 px-3">Quiz</Button>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/document-card.tsx
git commit -m "feat: update DocumentCard styling for Warm Academic"
```

---

### Task 4: Update dashboard page with sidebar

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Update imports and page structure**

Add `Sidebar` to imports:
```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DashboardStats } from "@/components/dashboard-stats";
import { DocumentCard } from "@/components/document-card";
import { Sidebar } from "@/components/sidebar";
import { getCurrentMonth } from "@/lib/utils";
```

Change the page wrapper to use sidebar layout:
```tsx
<div className="flex min-h-screen bg-background">
  <Sidebar />
  <div className="flex-1 py-6 px-6 max-w-4xl">
    {/* existing content stays the same */}
  </div>
</div>
```

Compute `topicsExtracted` from `topicCountMap`:
```tsx
const topicsExtracted = topicCounts?.length || 0;
```

Pass it to `DashboardStats`:
```tsx
<DashboardStats
  documentsUsed={documents?.length || 0}
  documentsLimit={3}
  quizzesUsed={usage?.quizzes_used || 0}
  quizzesLimit={5}
  averageScore={avgScore}
  topicsExtracted={topicsExtracted}
  isPro={isPro}
/>
```

Add `topicsExtracted={topicsExtracted}` — the rest of the page stays exactly the same.

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: integrate Sidebar into dashboard page"
```
