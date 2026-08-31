# Fix: Mixed-subject homework briefs sent to HeyCleo

## What we sent for karenburfoot81@gmail.com (Jake, student 310)

Sync log (`notifications`, type `heycleo_weekly_homework_sync`) confirms a payload was **sent successfully** on 31 Aug 2026, 06:01 for week 2026-08-24 → 2026-08-31 with 1 subject:

```text
subject: "KS2 Maths"
year_group: "KS2"
difficulty_tag: 2
topics: ["Area and Perimeter", "Adding and Subtracting Fractions", "Inference", "Using Dialogue"]
```

HeyCleo's copy (`heycleo_homework_completion`) shows it as: "KS2 Maths — week of 2026-08-24", due 2026-09-06, status assigned.

## Root cause

The lesson on Thu 27 Aug 18:00 was a **combined 1-1 KS2 English/Maths lesson**. The AI-generated `homework_brief` on `lesson_student_summaries` put ALL topics — including the English ones ("Inference", "Using Dialogue") — under a single subject of "KS2 Maths". `weekly-homework-sync` faithfully forwarded that mixed topic list to HeyCleo, which could then generate English homework from a "Maths" brief instead of Area and Perimeter.

The sync is not the bug — the brief it consumed mixes subjects.

## Plan

1. **Split briefs per subject at generation time** — update `generate-lesson-summaries` (edge function) so that when a lesson covers multiple subjects, the `homework_brief` contains a `subjects` array: one entry per subject with its own topics, year group, and difficulty tag. Single-subject lessons keep the current shape.
2. **Update `weekly-homework-sync`** to read `homework_brief.subjects[]` when present (sending one subject entry per subject to HeyCleo), falling back to the current single-subject format for old rows.
3. **Fix Jake's current week** — correct the stored brief for lesson `e32ebd60` (split into KS2 Maths: Area and Perimeter, Adding and Subtracting Fractions; KS2 English: Inference, Using Dialogue), then re-run `weekly-homework-sync` for student 310, week 2026-08-24 so HeyCleo receives the corrected request.
4. **Scan for other affected students** — query recent `homework_brief` rows whose topics mix English and Maths keywords under one subject, and report how many other families may have received mixed homework.

## Technical details

- Files: `supabase/functions/generate-lesson-summaries/index.ts`, `supabase/functions/weekly-homework-sync/index.ts`.
- Brief correction via targeted `UPDATE` on `lesson_student_summaries.homework_brief` for Jake's row.
- Re-run: POST to `weekly-homework-sync` with `{ week_start: "2026-08-24", student_ids: [310] }`; HeyCleo dedupes/replaces by `sync_id` (sha256 of student+week), so the corrected payload replaces the old one.
