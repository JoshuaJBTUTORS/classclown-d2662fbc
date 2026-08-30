# Refine Welcome Onboarding Slides

## What changes

### 1. Remove all hyphens from slide copy
- Replace em-dashes ("—") in slide points with natural sentence structure in `src/components/welcome/welcomeSlides.tsx`.

### 2. Rewrite "Homework & summaries" slide to point to HeyCleo
- New points tell parents/students to click HeyCleo to access homework.
- State that homework is released each Monday and due each Friday.
- Keep the Lesson Summaries point and the WhatsApp/email nudge point, rephrased without hyphens.

### 3. Add real platform screenshots to each slide (recommended)
Yes, real images will make the tour much clearer than icons alone.
- Capture screenshots from the live app: Calendar view (for Lessons & plans), HeyCleo/homework view (for Homework & summaries), Progress view (for Progress slide).
- Store them under `src/assets/onboarding/` and add an `image` field to each `TourSlide`.
- Update `WelcomeOnboarding.tsx` so each slide shows the screenshot in a rounded, black-outlined ClassClown frame alongside the existing icon and points.
- Screenshots are static marketing-style captures; they will not change as the live app changes, which is acceptable for onboarding.

## Technical details
- Files: `src/components/welcome/welcomeSlides.tsx`, `src/components/welcome/WelcomeOnboarding.tsx`, new images in `src/assets/onboarding/`.
- No changes to gating, steps count, completion flags, or sign-out behavior.
- Verify with typecheck and build.
