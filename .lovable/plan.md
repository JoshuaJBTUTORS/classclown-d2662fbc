# Homework by month chart — pastel peach restyle

## Goal
Change the filled area and squiggle line of the Homework by month chart on `/progress` to a nice pastel peach, replacing the current very-light-blue tokens.

## Changes
- `src/index.css` (light theme `:root`):
  - `--progress-bar-fill` → a soft blush peach fill (e.g. `20 80% 94%`)
  - `--progress-bar-line` → a slightly deeper peach stroke (e.g. `20 70% 75%`)
  - Dark theme values updated to a dimmed peach so it stays legible on dark surfaces.
- `src/components/progress/ProgressChart.tsx` — no code change needed; it already consumes `hsl(var(--progress-bar-fill))` and `hsl(var(--progress-bar-line))`, so the token update flows through automatically. The circle-dot strokes also pick up the new line token.

## Verification
- `tsgo` typecheck (no TS impact expected).
- Build log confirms `build OK`.
- Visual: the squiggle area and line render in pastel peach with the existing average baseline, gridlines, hover tooltips, and month navigation intact.

## Out of scope
- No layout, data, filter, or behaviour changes.
