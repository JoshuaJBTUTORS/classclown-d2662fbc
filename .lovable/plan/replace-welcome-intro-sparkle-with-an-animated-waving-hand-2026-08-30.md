# Replace welcome intro sparkle with an animated waving hand

## Goal
On the `/welcome` onboarding intro slide (step 0), the circular badge currently shows a static `DoodleSparkle` (a cluster of four-pointed stars). Replace that sparkle with a hand-drawn waving hand that animates a gentle wave on load.

## Current state (verified)
- `src/components/welcome/welcomeSlides.tsx` line 59: `export const WelcomeIntroIcon = DoodleSparkle;`
- `src/pages/WelcomeOnboarding.tsx` line 196 renders it inside a 16×16 mint circle:
  ```tsx
  <WelcomeIntroIcon className="h-8 w-8 text-pastel-mint-foreground" />
  ```
- `DoodleSparkle` lives in `src/components/calendar/LessonDoodles.tsx` and uses the shared hand-drawn doodle style (24×24 viewBox, `stroke=currentColor`, strokeWidth 1.6, round caps/joins).

## Plan
1. Add a new `DoodleWave` component to `src/components/calendar/LessonDoodles.tsx`, reusing the same `base` doodle props (viewBox/stroke) so it matches the existing hand-drawn aesthetic. The SVG draws a simple waving hand (palm + fingers + motion arcs), with the hand group given an `origin` at the wrist so it can rotate.
2. Add a CSS keyframe `wave` to `src/index.css` that rotates the hand a few degrees back and forth (e.g. 0° → ~18° → -8° → 0°) over ~1.4s, `infinite`, `ease-in-out`, with `transform-origin` at the wrist. Add a matching `.animate-wave` utility class so it can be applied via className.
3. Update `src/components/welcome/welcomeSlides.tsx`:
   - Import `DoodleWave` from `@/components/calendar/LessonDoodles`.
   - Change `export const WelcomeIntroIcon` from `DoodleSparkle` to a small wrapper that renders `DoodleWave` with the `animate-wave` class applied, preserving the `{ className }` pass-through so `WelcomeOnboarding.tsx` sizing stays identical.

## Scope / non-goals
- Visual-only change on the welcome intro slide. No copy, flow, button, gating, or logic changes.
- The other slides' icons (DoodleCalendar, DoodleClipboard, DoodlePeople, DoodleCheck on the final "All set" slide) are unchanged.
- No new dependencies; pure SVG + CSS keyframe.

## Verification
- Typecheck and build pass.
- Visit `/welcome` (or the intro step) in the preview and confirm the mint circle now shows an animated waving hand instead of the sparkle.
