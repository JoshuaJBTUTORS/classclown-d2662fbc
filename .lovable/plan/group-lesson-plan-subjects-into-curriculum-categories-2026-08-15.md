# Group Lesson Plan subjects into curriculum categories

Replace the single long grid of subject tiles on `/lesson-plans` with four collapsible curriculum groups so the page is calmer and easier to scan.

## Groups

Derived from the subject names already stored in the database (no hard-coded subject lists):

- **11 Plus** — any subject starting with "11 Plus" (English, Maths, Verbal Reasoning, Non-Verbal Reasoning)
- **KS2** — any subject starting with "KS2"
- **KS3** — any subject starting with "KS3" (matching is case-insensitive, so "KS3 maths" and "KS3 science" are included)
- **GCSE** — any subject starting with "GCSE"

Anything that does not match one of those prefixes falls into a final **Other** group, shown only when it has subjects, so nothing ever disappears from the page.

Group order: 11 Plus, KS2, KS3, GCSE, Other. Groups with no subjects are hidden.

## Category header design

Each group gets a clean, full-width expandable header:

```text
11 Plus
4 subjects                                             ^
```

- Group name in the heading font, subject count underneath in muted text
- Chevron on the right that rotates between up (open) and down (collapsed)
- Whole header is a button: click or keyboard-activate to toggle
- Soft rounded surface consistent with the existing pastel style, with a light hover state

## Behaviour

- All groups start expanded on desktop; on small screens only the first group starts expanded to keep the page short
- Expanded state is local to the page (not persisted)
- When a search term is active, groups auto-expand and only matching subjects are shown; empty groups are hidden
- Subject tiles themselves are unchanged — the existing `SubjectCard` is reused inside each group's grid

## Technical notes

- New `src/components/lessonPlans/subjectGroups.ts`: prefix-based categoriser plus group ordering/labels
- New `src/components/lessonPlans/SubjectCategorySection.tsx`: header + collapsible grid, built on the existing shadcn `Collapsible` primitive
- `src/pages/LessonPlans.tsx`: apply the search filter to the computed `subjectStats`, group them, and render one section per group instead of the flat grid
- No database, RLS, or query changes
