# Parent & student onboarding: details + platform tour

A new full-page onboarding at `/welcome`, shown once to parent and student accounts, styled in the ClassClown design language and laid out as slides (centred card, dot progress, Skip, back/next arrows, doodle character) like the reference image.

## Flow

```text
Slide 1  Welcome        -> "Welcome to ClassClown" intro + what the platform does
Slide 2  Your details   -> school + year group for each child (required)
Slide 3  Joining lessons     -> calendar, lesson card, join button
Slide 4  Homework            -> where homework lives, how to submit
Slide 5  Lesson plans        -> what will be taught
Slide 6  Lesson summaries    -> what happened in a lesson, engagement, homework set
Slide 7  My children progress-> progress page
Slide 8  School progress     -> uploading reports, tracking school grades
Slide 9  All set             -> "Go to my calendar" button
```

- Skip is available on every slide except the details slide (details must be filled before finishing).
- Students see one details form for themselves; parents see one block per linked child.
- Returning users (accounts that already existed before this feature) see the same flow — they can skip the tour slides but still complete the details slide once.
- Once finished or skipped, the user never sees it again; it can be reopened later from Settings via a "Replay tour" link.

## Where it appears

A small guard inside the main app layout: if the signed-in user has role `parent` or `student` and their profile has not completed onboarding, they are redirected to `/welcome`. Admins, owners and tutors are unaffected. The existing admin `/onboarding` page (proposal → parent creation) is untouched.

## Data collected

- Child's school (free text)
- Child's year group (dropdown of UK year groups / Scottish S-levels, matching the year groups already used elsewhere)

Stored against each child's student record so admins and tutors see it on the student profile and student list detail pages.

## Technical notes

- Migration: add `school text` and `year_group text` to `public.students` (nullable), with grants unchanged for existing roles; add `platform_tour_completed_at timestamptz` to `public.profiles` and reuse the existing `onboarding_completed` / `onboarding_completed_at` columns as the "seen it" flag.
- RLS: parents can already update their own children's rows; confirm and, if not present, add an update policy scoped to `parent_id` matching the caller so the details slide can save. Students update their own row via `user_id`.
- New files: `src/pages/WelcomeOnboarding.tsx` (slide shell, progress dots, skip/back/next), `src/components/welcome/` slide components, `src/components/routing/WelcomeOnboardingGuard.tsx`.
- Styling uses existing `--pastel-*` tokens, 1.5rem radii, black outlines, Plus Jakarta Sans headings and the doodle icons from `src/components/calendar/LessonDoodles.tsx`; no hardcoded colours.
- Read/write via the existing Supabase client and `useAuth`; no edge functions needed.
- Student profile views (`ViewStudentProfile.tsx`, `StudentDetail.tsx`) get read-only school / year group fields added.
