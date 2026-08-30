# Welcome onboarding: fill vertical length

## Problem
After widening, the card spans ~99% width but is vertically short, leaving a large empty band below it on desktop ("not using maximum length").

## Root cause (confirmed)
`src/pages/WelcomeOnboarding.tsx`: the page is `min-h-screen` but the inner card hugs its short content, so the remaining viewport height is empty.

## Change (visual only)
Make the inner column a flex column that fills the viewport height, and let the card grow to fill it so the footer sits at the bottom.

`src/pages/WelcomeOnboarding.tsx`:
1. Inner wrapper (~line 342): add `flex min-h-[calc(100vh-3rem)] flex-col`.
2. Card container (~line 357): add `flex-1 flex flex-col` so it stretches.
3. Keep the footer `Step X of N` below; the card grows to push it toward the bottom.

No changes to step flow, buttons, validation, gating, slide content, or the intro hand.

## Verification
- `npx tsgo --noEmit` passes.
- Build log shows `build OK`.
- Desktop `/welcome`: card fills the viewport height, minimal empty band.
