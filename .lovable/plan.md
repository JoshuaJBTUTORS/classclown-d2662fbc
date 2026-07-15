## Student detail view — weekly topics covered, grouped by subject

Clicking a row on `/students-list` opens a detail page that shows, for the selected week, every topic the student covered — grouped by subject — with prev/next week navigation.

### Route & entry
- New route: `/students-list/:studentId` → new page `src/pages/StudentDetail.tsx`.
- On `/students-list`, each table row becomes clickable (row `onClick` + `cursor-pointer`) → navigates to the detail page.
- Detail page uses the same shell (`Navbar` + `Sidebar` + `PageTitle`), roles `admin`/`owner`.

### Data source
For the student, join:
- `lesson_students` → find lesson ids for that `student_id`.
- `lessons` (filter `start_time` inside the selected week, Europe/London Mon–Sun) → gives `subject` and lesson date/title.
- `lesson_student_summaries` (match `student_id` + `lesson_id`) → gives `topics_covered` (text array).

If no summary exists for a lesson yet, the lesson is still listed under its subject with a "Topics pending — transcript still processing" note.

### Layout
```
[ ← Prev week ]   Mon 13 Jul – Sun 19 Jul 2026   [ Next week → ]   [ This week ]

Subject: GCSE Biology
  • Mon 13 Jul — "Cell structure"
      Topics: Prokaryotes, Eukaryotes, Organelles
  • Wed 15 Jul — "Enzymes"
      Topics: Active site, Lock & key model

Subject: GCSE Maths
  • Tue 14 Jul — "Trigonometry"
      Topics: SOH CAH TOA, Right-angled triangles

(Empty state) No lessons this week.
```
- One `Card` per subject; inside, one row per lesson with date, lesson title, and its topics as small badges.
- Header shows week range and lesson count.

### Week logic
- Week = Monday 00:00 → Sunday 23:59 in `Europe/London`.
- Default = current week. Prev/Next shift by ±7 days. "This week" resets.

### Files
- New: `src/pages/StudentDetail.tsx`, `src/hooks/useStudentWeeklyTopics.ts` (fetch + week state).
- Edit: `src/App.tsx` — add nested route `students-list/:studentId` under the same protected group.
- Edit: `src/pages/StudentsList.tsx` — make rows navigate on click.

### Out of scope
- No editing, no exports, no mastery/engagement scores yet — only the weekly topic list grouped by subject, per your request.
- No changes to summary generation — read-only view of existing data.