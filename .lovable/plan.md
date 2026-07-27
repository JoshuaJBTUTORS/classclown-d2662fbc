## Hard filters for HeyCleo weekly sync

Apply in `supabase/functions/weekly-homework-sync/index.ts` so both the manual button and any future cron use the same rules.

### 1. Exclude NVR (Non-Verbal Reasoning)
During aggregation, skip any summary whose subject matches NVR (case-insensitive, tolerant of variants: `NVR`, `non-verbal reasoning`, `non verbal reasoning`, `nonverbal reasoning`). Check both `homework_brief.subject` and `lessons.subject` — if either matches, drop the row. Verbal Reasoning (VR) and other 11+ subjects are still synced.

### 2. Require at least one attended lesson
The current attendance filter drops individual no-show rows, but make the "nothing to send" case explicit:
- After aggregation + NVR filter, if a student has zero subjects / zero surviving lessons, skip them and count as `skipped` with reason `no_eligible_lessons`.
- Do not POST to HeyCleo for that student.

### 3. Logging + response
- Log skipped students with reason (`only_nvr`, `no_attended_lessons`).
- Include the skip reason on the per-student `notifications` row already written.

### Files touched
- `supabase/functions/weekly-homework-sync/index.ts` (filter + skip accounting only)

No schema changes, no receiver changes, no new secrets.