# Design

## Visual Theme

**Register:** brand + product

Warm Academic — a palette inspired by well-bound books, warm paper, and scholarly confidence. Clean sans-serif typography throughout for a modern feel that doesn't sacrifice warmth.

## Color Palette

### Light mode (default)

| Token | HSL | Usage |
|---|---|---|
| `--background` | `40 20% 95%` | Warm paper page background `#F5F2EB` |
| `--foreground` | `20 15% 12%` | Body text — warm near-black `#2C1810` |
| `--card` | `40 15% 90%` | Card / surface background `#E8E2D4` |
| `--card-foreground` | `20 12% 18%` | Text on card surfaces |
| `--primary` | `215 40% 17%` | Deep navy — buttons, links, key UI `#1B2A3B` |
| `--primary-foreground` | `40 10% 95%` | Text on primary backgrounds |
| `--accent` | `30 45% 60%` | Gold accent — highlights, badges `#C4956A` |
| `--accent-foreground` | `20 15% 12%` | Text on accent backgrounds |
| `--muted` | `40 12% 88%` | Muted backgrounds, hover states |
| `--muted-foreground` | `35 10% 40%` | Secondary text — muted but readable |
| `--border` | `40 12% 82%` | Borders, dividers `#D6CEBB` |
| `--ring` | `215 40% 17%` | Focus rings (matches primary) |
| `--destructive` | `0 70% 55%` | Errors, destructive actions |
| `--destructive-foreground` | `0 0% 98%` | Text on destructive backgrounds |
| `--radius` | `0.5rem` | Border radius |

### Dark mode

Anticipated: invert the lightness axis while preserving the warm hue rotation. Background becomes a deep warm charcoal (~20 15% 8%), surfaces step up. Primary navy shifts lighter for contrast on dark. Accent gold holds its hue but gains saturation. Dark mode deferred until light mode is shipped.

## Typography

### Font family

All sans-serif — one family for headings and body.

**Primary choice:** Inter (variable weight, excellent readability, academic without being stuffy).  
**Fallback:** system-ui stack.

### Scale

| Level | Size / Weight | Usage |
|---|---|---|
| Hero heading | `clamp(2rem, 5vw, 3.25rem)` w700 | Landing page hero |
| h1 | `clamp(1.5rem, 3vw, 2rem)` w700 | Page titles |
| h2 | `1.25rem` w600 | Section headings |
| h3 | `1.05rem` w600 | Card / sub-section headings |
| Body | `0.9375rem` w400 | Paragraphs, general text |
| Small | `0.8125rem` w400 | Captions, metadata |
| Label | `0.75rem` w500 uppercase 1.5px tracking | Eyebrow / kicker text |
| Button | `0.875rem` w500 | Button labels |

Line height: 1.5 for body, 1.15–1.2 for headings.  
Max body width: 65ch.

## Spacing

Based on a 4px grid. Key spacing values used in the landing page:

- Section padding: `3rem` vertical
- Card padding: `1.25rem`
- Gap between features: `2rem`
- Button padding: `0.75rem 1.5rem`
- Nav padding: `1rem 1.75rem`

## Component Style

### Buttons
- `border-radius: 0.5rem`
- Solid primary: navy bg, warm paper text
- Outline: 1px solid border, warm foreground text
- Hover: subtle brightness shift (lighten navy by 10% for solid, darken border for outline)

### Cards / Surfaces
- `border-radius: 0.5rem`
- Background: `--card` or `--background`
- Border: 1px solid `--border`
- No shadow by default — rely on background and border contrast for depth

### Links
- Navy color, underline on hover (not by default)
- Accent gold for decorative / highlight links

## Motion

- Transition duration: 200ms ease-out for hover/focus states
- Page transitions: 300ms ease-out
- `prefers-reduced-motion: reduce` → 0ms transitions, no animations
- Staggered reveals: 50ms delay between items, max 300ms

## Notes

- Dark mode TBD after light mode ships
- Additional accent colors (for quiz results, progress indicators) TBD per feature context
- This DESIGN.md should be kept in sync as new components and pages are added
