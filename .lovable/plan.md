# Show the lesson plan topic inside the calendar lesson dialog

Add a "This Week's Plan" card to the lesson details dialog so anyone opening a lesson can see which academic week it falls in and the exact topic scheduled for that subject that week.

## What you'll see

In the lesson dialog (the one shown in your screenshot), directly under "Lesson Completion Progress", a new card:

```text
Lesson Plan
Week 3 · Autumn term                     KS3 Maths
Topic: Negative numbers and directed number
Short description of the week's focus...
```

States handled:
- Plan found — week number, term, topic title, description.
- Subject has plans but not for that week — "No plan set for Week 3".
- Subject has no plan at all — "No lesson plan linked for KS3 Geography" plus a link to the Lesson Plans page (admins/owners/tutors only).

## Connecting lessons to the right plan

Two things decide which plan row to show:

1. **Week number** — derived from the lesson's own start date (not today's date), using the same academic-week rule already used on the Lesson Plans page: Week 1 = Monday of the week containing 1 September.
2. **Subject** — matched against `lesson_plans.subject`.

Subject names in the calendar don't always match the plan library exactly, so matching is case-insensitive and goes through a small alias table for known mismatches found in the data:

| Lesson subject | Lesson plan subject |
| --- | --- |
| 11 Plus NVR | 11 Plus Non-Verbal Reasoning |
| 11 Plus VR | 11 Plus Verbal Reasoning |
| KS3 maths / KS3 Maths | KS3 maths |
| KS3 science / KS3 Science | KS3 science |
| GCSE Maths Highier, GCSE Maths Foundation, Year 11 Maths Highier/Foundation | GCSE Maths |
| Year 11 Combined Science | GCSE Combined Science |
| Year 11 English | GCSE English |
| Year 11 Chemistry / Physics | GCSE Chemistry / GCSE Physics |
| Sats English / Maths, Early KS2 English / Maths | KS2 English / KS2 Maths |

Subjects with no plan library (A-level, GCSE Business, GCSE Computer Science, KS3 Geography, etc.) simply show the "no plan linked" state.

## Technical notes

- `src/utils/academicWeekUtils.ts`: extract the current "now" logic into `getAcademicWeekForDate(date)` returning `{ weekNumber, term, academicYear, weekRange }`; keep `getAcademicWeekInfo()` as a wrapper so existing callers are unchanged.
- New `src/utils/lessonPlanSubjectMatch.ts`: `normaliseSubject()` + alias map above, exported so it can be reused later.
- New `src/hooks/useLessonPlanForLesson.ts`: given `subject` and `startTime`, computes the week and queries `lesson_plans` (`subject` case-insensitive via the resolved alias, `week_number` = computed week); also fetches a count of plans for that subject to distinguish "no plan this week" from "subject not in library".
- New `src/components/calendar/LessonPlanCard.tsx`: presentational card following the existing dialog card styling (`Card`/`CardContent`, muted labels, `Badge`).
- `src/components/calendar/LessonDetailsDialog.tsx`: render `LessonPlanCard` after the completion-progress card, passing `lesson.subject` and `displayStartTime` (so recurring instances use the instance date, not the series start).

No database or schema changes are needed — `lesson_plans` already has `subject`, `week_number`, `term`, `topic_title`, `description`.
