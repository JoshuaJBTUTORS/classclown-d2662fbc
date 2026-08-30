# Welcome onboarding: bigger hand + full-width desktop

## Goal
On `/welcome` (mandatory onboarding for parents/students): make the waving hand bigger and remove the green circle around it, and widen the layout to use the full page width on desktop.

## Changes (visual only; no flow/UX changes)

### 1. Bigger waving hand, no green circle
File: `src/pages/WelcomeOnboarding.tsx` (intro step, ~lines 194–197)

Current:
```tsx
<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground/90 bg-pastel-mint">
  <WelcomeIntroIcon className="h-8 w-8 text-pastel-mint-foreground" />
</div>
```

Replace with a larger bare emoji (no circle/border/background), e.g.:
```tsx
<div className="mx-auto mb-6 flex justify-center">
  <WelcomeIntroIcon className="text-6xl" />
</div>
```
- Keep the existing `animate-wave` animation (already applied inside `WelcomeIntroIcon`).
- Increase emoji size to ~`text-6xl` so the hand is clearly larger than the old badge.
- No border/background — just the waving emoji on the page background.

### 2. Full-width desktop layout
File: `src/pages/WelcomeOnboarding.tsx` (root container, ~line 336 and ~line 342)

Current outer wrapper:
```tsx
<div className="relative mx-auto w-full max-w-3xl">
```

Widen for desktop while staying readable on mobile:
- Change `max-w-3xl` → `max-w-6xl` (or `max-w-7xl`).
- Keep `mx-auto w-full` so it stays centered and responsive.
- Inner card padding (`p-6 sm:p-10`) unchanged.

This lets the onboarding card span most of the page width on desktop and removes the large side margins, without affecting mobile.

## Out of scope
- No changes to the step flow, buttons, validation, gating, slide content, colors of other slides, or the finish step icon.
- The finish-step "all set" circle icon is unchanged (separate from the intro hand).

## Verification
- `npx tsgo --noEmit` passes.
- Build log shows `build OK`.
- Visual check of `/welcome` on desktop: hand is larger, no green circle, card spans full width with minimal side whitespace.
