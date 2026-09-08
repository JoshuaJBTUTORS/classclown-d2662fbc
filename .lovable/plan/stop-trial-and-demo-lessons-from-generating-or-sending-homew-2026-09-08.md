# Stop trial and demo lessons from generating or sending homework

Simple rule: if a lesson is a trial or demo, we never generate homework from its transcript, and we never send it anywhere.

## What changes

1. Stop it at the source
   - When a lesson finishes and its transcript is processed, check the lesson type first.
   - If the type is trial or demo, skip the whole summary/homework generation step and log it as skipped. No AI cost, no homework data created.

2. Stop it in the pipelines that trigger processing
   - The daily catch-up run, the hourly run, and the live transcript webhook all filter out trial and demo lessons before asking for a summary.

3. Safety net at sending time
   - The weekly homework sync to HeyCleo ignores any homework tied to a trial or demo lesson, even if older data exists.
   - The homework reminder nudges do the same.

Regular and review-room lessons behave exactly as they do today.

## Technical notes

- Guard on `lessons.lesson_type in ('trial','demo')`.
- Add early return in `supabase/functions/generate-lesson-summaries/index.ts` after the lesson fetch (include `lesson_type` in the select) returning `{ skipped: 'trial_or_demo' }`.
- Add the same filter in `daily-lesson-processing`, `hourly-lesson-processing`, and `lessonspace-transcript-webhook` before invoking summary generation.
- In `weekly-homework-sync/index.ts`, extend the existing `lessons!inner(...)` select with `lesson_type` and add `.not("lessons.lesson_type", "in", "(trial,demo)")`; count them in a `skipped_trial` stat.
- Apply the equivalent filter in `homework-nudge-reminders`.
- Deploy the affected edge functions; no schema change and no historical data cleanup.
