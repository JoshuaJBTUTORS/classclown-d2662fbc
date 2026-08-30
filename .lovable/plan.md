# Welcome Intro: Match the Login Page Waving Hand

## Context
On the login page, the waving hand is the standard 👋 emoji ("Welcome Back to Class Beyond! 👋"). The `/welcome` intro slide currently shows a custom hand-drawn SVG (`DoodleWave`), which looks different. The user wants the same 👋 style as the login page.

## Changes

1. **`src/components/welcome/welcomeSlides.tsx`** — `WelcomeIntroIcon`
   - Replace the `DoodleWave` SVG with the 👋 emoji rendered at large size, with the existing `animate-wave` keyframe applied (transform-origin at the wrist so it waves like a hand, same gentle motion as now).
   - `aria-hidden="true"` so screen readers don't announce it; the slide heading already provides context.
   - Keep the surrounding pastel circle / badge wrapper in `WelcomeOnboarding.tsx` untouched.

2. **`src/components/calendar/LessonDoodles.tsx`**
   - Remove the now-unused `DoodleWave` export (no other references after step 1).

3. **`src/index.css`**
   - Keep the existing `cc-wave` keyframe; adjust `transform-origin` to `70% 80%` so it works correctly on an emoji glyph (bottom-right wrist pivot).

## Verification
- Typecheck + build log clean.
- Confirm no remaining `DoodleWave` imports.
