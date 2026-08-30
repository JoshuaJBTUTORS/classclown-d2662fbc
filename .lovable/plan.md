# Welcome onboarding: reduce desktop white space

## Problem
On desktop `/welcome` the card is capped at `max-w-6xl` (~72% of a wide screen), leaving ~14% white space on each side, plus large empty vertical space below the short card.

## Root cause (confirmed)
- `src/pages/WelcomeOnboarding.tsx` is rendered bare under `ProtectedRoute` (NOT inside `MainLayout`), so the only width cap is its own `max-w-6xl`.
- Outer wrapper: `relative min-h-screen bg-background px-4 py-10 sm:px-8` + inner `max-w-6xl`.
- The short card + `min-h-screen` leaves a large empty band below.

## Changes (visual only; no flow/UX changes)

### 1. Use near-full page width
`src/pages/WelcomeOnboarding.tsx` (~line 342)
- Change `max-w-6xl` → remove the cap: use `max-w-full` (or a generous `max-w-[1600px]`).
- Keep `mx-auto w-full` so it stays centered.

### 2. Tighten outer padding so content fills the page
`src/pages/WelcomeOnboarding.tsx` (~line 336)
- Change `px-4 py-10 sm:px-8` → `px-6 py-6 sm:px-10 lg:px-16` (smaller vertical padding, larger horizontal on big screens).
- Keep `min-h-screen` so the page still owns the full viewport, but reduce the dead space below by lowering `py`.

### 3. (Optional) Let the card grow vertically
If the empty band below still looks large after padding reduction, the inner card can stretch: add `min-h-[calc(100vh-8rem)]` to the card container so it fills available height instead of hugging its short content. This is optional and only applied if needed.

## Out of scope
- No changes to step flow, buttons, validation, gating, slide content, the intro hand size, or the finish step.

## Verification
- `npx tsgo --noEmit` passes.
- Build log shows `build OK`.
- Desktop `/welcome`: card spans near-full width with minimal side margins; noticeably less empty vertical space.
