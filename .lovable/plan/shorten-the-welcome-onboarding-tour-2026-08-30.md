# Shorten the /welcome onboarding tour

The tour currently has 6 content slides (Joining lessons, Homework, Lesson plans, Lesson summaries, My children progress, School progress) on top of Welcome / Your details / All set — 9 steps total. Collapse the 6 content slides into 3 combined slides.

## New flow (6 steps instead of 9)

```text
Step 1  Welcome                    -> unchanged
Step 2  Your details               -> unchanged (school + year group)
Step 3  Lessons & plans            -> Joining lessons + Lesson plans merged
Step 4  Homework & summaries       -> Homework + Lesson summaries merged
Step 5  Progress                   -> My children progress + School progress merged
Step 6  All set                    -> unchanged
```

## Changes

1. **`src/components/welcome/welcomeSlides.tsx`**
   - Replace the 6 `TOUR_SLIDES` entries with 3 combined ones:
     - **Lessons & plans** (DoodleCalendar, pastel-sky): join via the calendar, one-click Join button, and lesson plans show what's being taught ahead of time.
     - **Homework & summaries** (DoodleClipboard, pastel-butter): homework is attached to the lesson on the calendar, upload completed work there, and a summary recap appears after every session.
     - **Progress** (DoodlePeople, pastel-mint): track attendance, assessments and tutor feedback, and upload school reports so tutors can target the right topics.
   - Each combined slide keeps the same shape (title, subtitle, tone, icon, 3-4 bullet points) so the existing slide renderer works untouched.

2. **`src/pages/WelcomeOnboarding.tsx`** — no structural change needed; `totalSteps` derives from `TOUR_SLIDES.length`, so the dots and step counter shrink automatically. Will verify and adjust only if needed.

## Not changing

- Details collection, mandatory gating (`OnboardingGate`), completion flags, styling, back/next behaviour, and the sign-out button all stay exactly as they are.
