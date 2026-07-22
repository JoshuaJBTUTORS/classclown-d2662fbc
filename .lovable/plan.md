## Step 3: Add lessons + verification gate

### Behavior
- Replace the current "Review" step with a new step 3 titled "Add Lessons".
- Show a summary reminder of the parent (from step 1) and the sessions from the proposal (from step 2) so the admin knows what to schedule.
- Primary action: **Add lessons** button — opens `/calendar` in a new tab (so the wizard state is preserved in the current tab). Uses `window.open('/calendar', '_blank')`.
- Secondary action: **Check lessons** button — queries the DB to verify lessons exist for the parent's students. Disabled until the user has clicked "Add lessons" at least once (tracked in local state).
- Verification logic:
  - Look up students linked to the parent created in step 1 (`students.parent_id = <parent_id>` — or via the parent record created by `create-parent-account`).
  - Query `lessons` joined via `lesson_students` for any lesson with `start_time >= now()` belonging to those students.
  - If ≥1 upcoming lesson found → mark step 3 complete, show green success card listing the found lessons (date, time, subject, tutor), enable a **Continue / Finish** button.
  - If none found → show inline warning "No lessons found yet for this parent's students. Add them in the calendar, then click Check lessons again." Do NOT advance.
- Add a new step 4 "Done" (or reuse existing Review) that just confirms onboarding complete and offers a "Start new onboarding" / "Go to students" button. If simpler, keep step 3 as the terminal step and show the completion state inline once verified.

### Wizard state additions
- Carry `parentId` forward from step 1 (already created).
- Carry `proposalId` from step 2.
- New local state: `hasOpenedCalendar: boolean`, `foundLessons: Lesson[]`, `checking: boolean`.

### Files to touch
- `src/pages/Onboarding.tsx` — add step 3 UI, open-calendar handler, check-lessons handler, verification query, gating logic.

### Technical notes
- Parent → students linkage: `students.parent_id` references the `parents` table. After `create-parent-account` we need the resulting `parents.id`. If that isn't already returned/captured in step 1 state, fetch it by parent email or `user_id` right after creation and store in wizard state.
- Query for verification:
  ```sql
  select l.id, l.start_time, l.end_time, l.subject, l.tutor_id
  from lessons l
  join lesson_students ls on ls.lesson_id = l.id
  where ls.student_id in (<student ids for parent>)
    and l.start_time >= now()
  order by l.start_time asc;
  ```
- No DB or edge function changes.
- No changes to the calendar page itself — admin uses the existing "Schedule Lesson" flow there.

### Edge cases
- Parent has no students yet: "Check lessons" surfaces a message telling the admin to also add students to the parent in the calendar's add-lesson flow (students can be created inline there).
- User closes the calendar tab without adding anything: check button simply returns no results; they can retry.
