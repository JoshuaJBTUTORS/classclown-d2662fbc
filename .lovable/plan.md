# Homework by month — rounded bar histogram in pastel peach

## Goal
Restyle the Homework by month chart on `/progress` to match the reference: a row of soft rounded vertical bars (histogram style), in the chosen pastel blush-peach palette. No percentages are printed on the bars — values appear only on hover. Month arrows, average baseline, tooltips, and existing data/filtering behaviour are preserved.

## Changes

### `src/components/progress/ProgressChart.tsx`
- Replace the SVG squiggle/area chart with a set of evenly spaced vertical bars, one per visible month:
  - Each bar is a rounded rectangle (`rounded-full` top/bottom, pill-style) whose height maps to the month average (0–100%).
  - Bars with no data render as very light hollow/ghost bars at a small base height.
  - Default bar color: soft pastel peach fill (new token). The most recent month with data (or hovered month) gets a slightly deeper saturated peach highlight — like the reference's orange highlight bar.
  - No value labels printed inside/on the bars.
- Hover: existing per-month tooltips already show `{average}% average · n pieces marked` plus item breakdown — keep them, wired to the bar itself.
- Keep: panel title/description, left/right month arrows, window label, average baseline (dashed line + "avg X%" chip), month + year labels beneath bars, loading and empty states.
- Remove the SVG squiggle path/points rendering, `squigglePath` helper, and the `motion` path drawing animation (or repurpose with a simple bar grow-in animation on mount via Framer Motion height transition).

### `src/index.css`
- Update light theme tokens:
  - `--progress-bar-fill` → soft blush peach fill (e.g. `20 85% 90%`)
  - `--progress-bar-line` → deeper peach accent used for the highlighted bar (e.g. `18 80% 66%`)
- Add a third token if needed for the highlighted bar (e.g. `--progress-bar-highlight: 18 80% 66%`) with a dimmed dark-theme counterpart.

## Verification
- `tsgo` typecheck passes.
- Build log reports `build OK`.
- Visual check of `/progress`: rounded pill bars per month in pastel peach, latest month highlighted deeper peach, no on-bar percentages, hover reveals tooltip with average and items, arrows/page window work.

## Out of scope
- No data, filter, date-range, or role-gating changes. No changes to other panels (stats tiles, referral invite).
