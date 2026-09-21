# Repeating-lesson health audit

Renaming was only the visible symptom. The real question is: for every repeating group, do the upcoming sessions match what the group actually looks like today? This adds a proper audit that checks all the ways a session can drift, not just the name.

## What the audit checks

For each repeating series the audit compares three things side by side, so you can tell a deliberate change from a mistake:

- **A — the original series record** (how the group was first set up)
- **B — the most recent real session that actually happened**
- **C — the upcoming sessions**

Reading those together tells you which kind of problem you have: C matches A but not B means old details were carried forward by the automatic repeat job (a fault). C matches B but not A means the group was legitimately changed over time and the original record is simply stale. C matching neither means someone edited a single session by hand. Every finding is labelled with which of these it is.

Against that three-way comparison it flags:

1. Name, subject or teacher different across the three versions — labelled as carried-forward, stale original, or hand-edited.
2. Register different — students missing, or old students from the original setup reappearing.
3. Students on upcoming sessions who are no longer active, archived, or duplicated.
4. Group/one-to-one setting or lesson type different (a group turned into a 1-1, or a real lesson marked as a trial).
5. Time or length different — a session at the wrong hour, wrong weekday, or a different duration from the rest of the series.
6. Missing or duplicated dates — two sessions on the same date in one series, or a gap where a weekly session should be.
7. Broken repeat markers — sessions linked to a series but not labelled as part of it (this is what hides the "this lesson / all future lessons" choice), or missing their date stamp.
8. Orphans — sessions pointing at a series whose master record no longer exists.
9. Sessions that were deleted as "this and all future" but later regenerated, and sessions still present despite a cancellation record.
10. Copied video-room details — upcoming sessions reusing the same room link or calendar event as another session, which can send people into the wrong room.
11. Series whose master record no longer matches its own recent sessions (the root cause of last week's problem).

## How it is delivered

- A new admin page, **Repeat Health**, at `/admin/series-health`: a read-only list of every flagged series, showing the original setup, the last real session and the upcoming sessions in three columns so the difference is obvious at a glance, grouped by issue type and severity.
- Each row has a "Fix this series" action that aligns upcoming sessions and the series record to the latest real session (name, subject, teacher, register, group setting, duration) and repairs repeat markers. Nothing changes without a click; past sessions are never touched.
- A "Fix all safe issues" button for the clear-cut categories (broken repeat markers, stale master record, carried-forward names), leaving judgement calls like time changes and missing dates to be reviewed one by one.
- The same checks run daily and, when anything new is flagged, appear as an alert banner on Agent Cleo, in the same style as the tutor breach and churn alerts, so drift is caught within a day instead of being noticed on the calendar weeks later.

## Technical notes

- Audit implemented as a Postgres function returning one row per finding (`series_id`, `lesson_id`, `issue_code`, `expected`, `actual`, `severity`), so the page and the daily scan share one source of truth.
- Three snapshots per series: original = the parent `lessons` row (plus `recurring_lesson_groups` config), current = most recent `start_time < now()` instance with a roster, future = each upcoming instance; each finding records `origin_match` (`original` | `current` | `neither`) to classify it. Comparison fields: `title`, `subject`, `tutor_id`, `is_group`, `lesson_type`, duration (`end_time - start_time`), local time-of-day and weekday, roster set.
- Structural checks: `parent_lesson_id is not null and is_recurring_instance = false`, `instance_date is null`, duplicate `(parent_lesson_id, instance_date)`, missing parent row, rows matching `recurring_lesson_cancellations`, shared `lesson_space_room_id` / `google_event_id` across distinct future lessons.
- Findings stored in a new `recurring_series_findings` table (with grants and admin-only RLS) so the daily scan can diff against yesterday and only alert on new items; dismissals recorded per finding.
- Daily scan edge function `daily-series-health-scan` scheduled early morning; Agent Cleo banner reuses the existing breach/churn banner pattern and hook structure.
- Fix actions run server-side with the same alignment logic as `extend_recurring_lessons()` uses, so repairs and future generation stay consistent.
