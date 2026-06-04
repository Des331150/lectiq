# Landing Page Redesign

## Overview

Redesign the public landing page (`/`) with the approved Warm Academic visual system. This is a single-page marketing surface targeting university students who want to transform lecture materials into practice quizzes.

## Files Changed

| File | Change |
|---|---|
| `app/globals.css` | Replace HSL variables with Warm Academic palette |
| `tailwind.config.ts` | Add Inter font family configuration |
| `app/layout.tsx` | Add Inter font import via `next/font/google` |
| `app/page.tsx` | Complete redesign of landing page content and layout |

## Design Reference

- PRODUCT.md — brand register, personality, principles
- DESIGN.md — complete visual system (palette, typography, spacing, components)

## Implementation Plan

### Step 1: Update globals.css

Replace all HSL color tokens with the Warm Academic values from DESIGN.md.

Key changes:
- `--background`: `40 20% 95%` (warm paper)
- `--foreground`: `20 15% 12%` (warm near-black)
- `--primary`: `215 40% 17%` (deep navy)
- `--primary-foreground`: `40 10% 95%`
- `--accent`: `30 45% 60%` (gold)
- `--accent-foreground`: `20 15% 12%`
- `--muted`: `40 12% 88%`
- `--muted-foreground`: `35 10% 40%`
- `--border`: `40 12% 82%`
- `--ring`: matches primary
- Keep `--radius: 0.5rem`

### Step 2: Add font configuration

**tailwind.config.ts:** Add `fontFamily` extend with Inter as sans default.

```ts
fontFamily: {
  sans: ["var(--font-inter)", "system-ui", "sans-serif"],
},
```

**app/layout.tsx:** Import Inter from `next/font/google`, set the CSS variable.

```tsx
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Add {inter.variable} to root html className
```

### Step 3: Redesign app/page.tsx

Structure from top to bottom:

1. **Nav** (`py-4 px-7`)
   - Left: "Lectiq" in bold (`font-bold text-lg`)
   - Right: "Sign In" link (ghost style) + "Get Started" button (primary navy)

2. **Hero** (flex row, `py-16 px-7`, `gap-10`)
   - Left column (flex-1):
     - h1: "Turn your lecture notes" + line break + gold-span "into quizzes"
     - Subtitle: descriptive paragraph in muted foreground
     - CTA row: "Start Studying Free" (primary button) + "Sign In" (outline button)
   - Right column (flex-1):
     - Placeholder for app screenshot (`rounded-xl bg-card border h-[220px]`)
     - styled with dashed border and centered text

3. **How it works** (bordered section, `py-12 px-7`)
   - Accent gold uppercase label "How it works" (centered, letter-spaced)
   - 3-column grid with:
     - Numbered circle (navy bg, paper text)
     - Step title (semibold)
     - Description (muted foreground, `max-w-[240px]` centered)

4. **Footer** (`py-5 text-center text-sm text-muted-foreground border-t`)
   - "Lectiq — Study smarter"

### Edge Cases

- **Mobile:** Hero switches to single column (stack text above mockup placeholder). Steps stack vertically. Use responsive classes: `flex-col md:flex-row` for hero, `grid-cols-1 md:grid-cols-3` for steps.
- **Long text:** Subtitle capped at `max-w-[65ch]`. Heading uses `text-balance`.
- **Reduced motion:** No animations on this initial pass (deferred to a later polish step).

### Out of Scope

- Dark mode
- App screenshot (placeholder only — actual screenshot needs the app to be finalized)
- Animations / scroll reveals
- SEO / meta tags
- Performance optimization (images, etc.)
- Additional landing page sections (testimonials, pricing, FAQ)
