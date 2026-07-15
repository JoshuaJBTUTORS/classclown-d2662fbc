## Fix understanding badge — show confidence on the correct scale

The current badge reads e.g. "Understanding: 5% · medium" because I rendered the raw `confidence_score` as a percentage. In reality:

- `lesson_student_summaries.confidence_score` is an **integer 1–10** (verified in DB — values seen: 3, 4, 5, 6, 8, etc.)
- `engagement_score` is also 1–10
- `engagement_level` is a text label: `High` / `Medium` / `Low`

### Change
- Convert the raw 1–10 score to a percentage by multiplying by 10 for display, and show both forms so it's unambiguous:
  - `Understanding: 50% (5/10) · Medium engagement`
- Recolour thresholds using the true percentage:
  - ≥ 70% green, ≥ 40% amber, otherwise red.
- Fall back gracefully when a field is null (hide that piece rather than showing "null").

### Files
- Edit only `src/pages/StudentDetail.tsx` — badge label + threshold logic.
- No hook/data changes; `useStudentWeeklyTopics.ts` already exposes the raw values.

### Out of scope
- No changes to how the AI generates the score.
- No aggregation across the week — still one badge per lesson (matches your current view). Weekly average can come next if you want it.