# Redesign /students-list/:studentId to ClassClown design language

Visual-only restyle of `src/pages/StudentDetail.tsx`. **No UX changes**: all data fetching, the week navigator, the "This week" and "Sync to HeyCleo" actions, role gating (`canSync`), week logic, and every badge/condition stay exactly as they are.

## What changes (presentation only)

- **Page shell**: replace the plain container with the ClassClown full-width pastel layout used on the redesigned pages (soft background, generous rounded corners ~1.5rem, no generic gray cards).
- **Header**: back link becomes a small outlined pill with a doodle arrow; student name in Plus Jakarta Sans with an initials avatar chip and a count pill (e.g. "4 lessons this week").
- **Week navigator card**: soft white/pastel surface with black-outlined round prev/next buttons, rounded "This week" pill, and a black pill "Sync to HeyCleo" button (same pattern as the calendar/lesson-plan buttons). Missed/cancelled counts become pastel status chips instead of bordered outline badges.
- **Subject groups**: each subject card becomes a rounded pastel panel with a doodle book icon chip and lesson-count pill in the header.
- **Lesson rows**: replace the thin `border-l-2` markers with pastel-tinted rounded lesson blocks; topics become small pastel rounded chips; understanding/engagement badges map to design-language pastel statuses (green/yellow/red pastels, rounded, no harsh outlines).
- **Homework brief box**: dashed border box becomes a soft pastel "internal note" card with rounded chips for subject/year/difficulty.
- **Icons**: replace generic Lucide icons (BookOpen, Send, chevrons) with the project's hand-drawn `DoodleIcons`/`LessonDoodles` SVGs where equivalents exist; keep arrow glyphs for navigation.
- **Loading/empty states**: pastel rounded surfaces matching the redesigned list page.

## What does NOT change

- `useStudentWeeklyTopics` hook, weekStart/weekEnd, goPrev/goNext/goThisWeek.
- `handleSync` and the `weekly-homework-sync` invoke, toast messages, admin/owner gating.
- All conditional rendering rules (wasLate, confidenceScore thresholds, missed/cancelled counts, homework brief presence).
- Route, params, and navigation.

## Verification

- `tsgo` typecheck after edits; check `/tmp/observability/build-errors.log` is clean.
