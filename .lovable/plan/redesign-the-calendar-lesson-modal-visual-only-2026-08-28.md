# Redesign the calendar lesson modal (visual only)

Restyle the dialog that opens when a lesson is clicked on `/calendar` so it matches the ClassClown design language. No buttons added, removed, renamed or rewired; no data fetching, permissions or workflow logic touched.

## Design language applied

- Plus Jakarta Sans headings (`font-heading`, extrabold, tight tracking), Inter body
- Pastel surfaces (mint, lilac, butter, blush, sky, sand) instead of the current blue/amber/green ad-hoc tints
- `--radius-soft` (1.5rem) cards, `--shadow-soft` depth, no borders on pastel surfaces
- Generous whitespace, `p-6` sections
- Hand-drawn doodle icons replacing the Lucide icons in section headers ("NO LLM icons"), reusing the existing doodle sets rather than inventing new files where a match exists

## Section-by-section restyle (same order, same content)

1. Header — lesson title in heading font, doodle calendar mark, "Recurring Instance" as a soft pill
2. Assessment Week button (admin/owner) — same placement and action, restyled as a butter pastel chip
3. Lesson Completion Progress (teacher/admin) — sky pastel panel; the two rows (Mark Attendance, Submit Resources) become white rounded cards with doodle tick/circle status marks and pastel Complete/Pending pills
4. Lesson Plan card — passes through `LessonPlanCard` unchanged in behaviour, wrapper spacing aligned
5. Basic information — soft card; time, teacher, subject, group rows keep identical content with doodle clock/person/tag marks and pastel subject chips
6. Video Conference — soft card, Host/Student access pill restyled in mint/sky; the "no room yet" notice becomes a sand pastel panel; the Create LessonSpace Room button keeps its handler and label
7. Students + attendance — soft card, heading with doodle people mark, homework summary line kept; `StudentAttendanceRow` left as-is
8. Missing-student-data warning — sand pastel panel, same copy
9. Assigned Homework — mint pastel panel, same fields
10. AI lesson summaries — `StudentLessonSummary` untouched
11. Footer actions — Edit / Delete / Submit Resources / Process Lesson / Send Proposal keep exact labels, order, conditions and handlers; restyled as rounded outline buttons, Delete keeps destructive tone
12. Assign Assessment Week sub-dialog — matching soft styling, all fields and the assign action unchanged

## Impact assessment

- All JSX changes are className/wrapper-level. Conditional rendering expressions (`isTeacherRole`, `canEditLesson`, `canDeleteLesson`, `isTargetGCSELesson`, `lesson.lesson_type`, `homeworkStatus.exists`, `validStudents.length`) stay byte-identical in meaning.
- No changes to state, effects, Supabase queries, `lessonDeletionService`, resource upload, assessment assignment, or participant URL logic.
- Child components (`LessonPlanCard`, `VideoConferenceLink`, `StudentAttendanceRow`, `StudentLessonSummary`, `EditLessonForm`, `DeleteLessonDialog`, `SubmitResourcesDialog`, `TranscriptProposalDialog`) are not modified — only the containers around them. Their own styling stays as it is, so nothing else in the app that uses them changes.
- The modal is rendered from both `CalendarDisplay.tsx` and `TeacherCalendarView.tsx`; both get the same visual update with no prop changes.
- Dialog stays `max-w-2xl` scrollable so it fits the existing viewport behaviour.

## Files

- `src/components/calendar/LessonDetailsDialog.tsx` — presentation only
- `src/components/calendar/LessonDoodles.tsx` — new small SVG icon set for the modal (clock, person, people, tag, video, book, tick, circle, clipboard), in the same style as the existing sidebar/progress doodles
