# Why the 11 Plus rebuilds stop at week 30

The rebuild doesn't read the week count from your uploaded document — it reads it from the plan already in the database.

The four 11 Plus subjects each currently hold exactly 30 weeks (weeks 1-30):

- 11 Plus Maths — 30 weeks
- 11 Plus Verbal Reasoning — 30 weeks
- 11 Plus Non-Verbal Reasoning — 30 weeks
- 11 Plus English — 30 weeks

The rebuild function takes the lowest and highest existing week numbers and tells the model: "Week numbers must stay within 1-30. Output every week number from 1 to 30 exactly once." So no matter how much content the 52-week document contains, the model is instructed to compress it into 30 slots. By comparison, KS2 Maths, KS3 and GCSE subjects already hold 52 rows, which is why those rebuild to a full year.

There's a second knock-on: assessment weeks 22, 35 and 48 can't be created for a 30-week plan, since 35 and 48 fall outside the allowed range.

## The fix

Add a "Weeks in the plan" control to the Rebuild dialog, defaulting to 52.

- The dialog sends `targetWeeks` to the function.
- The function uses `1..targetWeeks` as the week range instead of deriving it from the existing rows.
- Weeks that don't exist yet are inserted (the function already handles inserts), so a 30-week subject grows to 52.
- Term labels for new weeks follow the same pattern the 52-week subjects use: weeks 1-12 Autumn, 13-24 Spring, 25-52 Summer — used only where there's no existing row to inherit a label from.
- All four assessment weeks (9, 22, 35, 48) become reachable again once the plan is 52 weeks.

Everything else stays as it is: removal of weeks without a clear learning outcome, rewording of anything that can't be taught online, and the document being the source of truth for topic order and naming.

## Technical notes

- `supabase/functions/rebuild-lesson-plan-from-pdf/index.ts`
  - Accept optional `targetWeeks` (clamped 1-52, default 52).
  - Replace `minWeek`/`maxWeek` from existing rows with `1`/`targetWeeks` in the instruction text.
  - Add a `termForWeek(n)` fallback (Autumn/Spring/Summer by the boundaries above) used when `termByWeek[n]` is missing.
  - Only apply the assessment-week rules for weeks inside the target range.
- `src/components/lessonPlans/RebuildPlanFromPdfDialog.tsx`
  - Add a small number/select input for weeks (default 52) and pass `targetWeeks` in the invoke body.
- No database or schema changes.
