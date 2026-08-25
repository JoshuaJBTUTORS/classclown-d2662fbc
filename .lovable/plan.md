# Organise HeyCleo data by student

Right now `/admin/heycleo-data` shows two flat lists (163 students, 849 homework rows) that aren't connected. This turns it into a student-first view: one row per student, with their homework rolled up and a drill-down for detail.

## What changes

**Student roster (main table)**
One row per HeyCleo student, showing:
- Name and email
- Whether they match a CRM student/parent record (matched on lowercased email) — a "Not in CRM" badge when there's no match
- Homework assigned (total)
- Completed count and completion rate
- Overdue count (due date passed, not completed)
- Average score (marks awarded / marks available, where marks exist)
- Last activity (most recent submitted/assigned date)
- Live tuition since

Search by name or email. Sort by completion rate, overdue count, or homework volume. Filters: all / has overdue / no homework / not in CRM.

**Student detail panel**
Clicking a row opens a side panel with that student's profile fields (year group, education level, exam year/month, working and target grade) and their full homework list — title, subject, assessment type, due date, status, started/completed, marks and percentage — sorted newest first, with a subject filter.

**Summary strip at the top**
Total students, students with overdue homework, overall completion rate across all synced homework, and the last sync time per dataset (kept from the current page), with the existing "Sync now" button.

**Homework tab**
Kept as-is for raw browsing, but each row links through to its student's detail panel.

## Technical details

- New hook `src/hooks/useHeyCleoStudents.ts`: fetches `heycleo_students` and `heycleo_homework_completion`, aggregates homework per `student_id` client-side (849 rows is well within a single query, using `.range()` to page past the 1000-row default when it grows), and left-joins CRM `students`/`parents` on lowercased email for the CRM-match badge.
- `src/pages/admin/HeyCleoData.tsx` rewritten around the roster table plus a `Sheet` detail panel; sync-status cards and the sync button stay.
- Aggregates stay in the frontend — no schema change, no new migration, and nothing is written back to HeyCleo.
- Note: `year_group`, `education_level`, `exam_year` and the grade fields are currently null/empty for the synced students, so those columns show "—" until HeyCleo populates them.
