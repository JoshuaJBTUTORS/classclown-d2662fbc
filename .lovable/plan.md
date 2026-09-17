# Add A-level History and A-level Psychology

Two new subjects become selectable everywhere subjects are chosen: lessons, tutor subjects, proposals, and topic requests.

## What changes

1. **Subject records** — add "A-level History" and "A-level Psychology" to the subjects table under the A-level category, with short descriptions matching the existing A-level entries.

2. **Lesson subject list** — add both to the app's subject list and to the A-Level group, so they appear when creating or editing a lesson.

3. **Topic request picker** — add both to the subject list used in the topic request dialog, keeping alphabetical order within the A-level block.

4. **Subject grouping** — History and Psychology will fall under the "Other" subject area, consistent with how Geography, Business, and Economics behave today.

## Technical notes

- Data insert into `public.subjects` (name, description, category `a_level`) via a data change, not a schema change.
- `src/constants/subjects.ts`: extend `LESSON_SUBJECTS` and `EDUCATIONAL_STAGES.a_level.subjects`.
- `src/components/calendar/TopicRequestDialog.tsx`: extend the local `SUBJECTS` array.
- `getSubjectArea` needs no change unless you want a dedicated Humanities area.

No existing lessons, tutors, or proposals are affected.
