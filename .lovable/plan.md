# /tutors — full width, subject-category colours, subject dropdown

Three visual changes to `src/pages/Tutors.tsx`. No workflow, data-fetching, dialog, tab, or pagination changes.

## 1. Full-width page

The content currently sits in a plain `p-4 md:p-8` main with no explicit cap, but rows are constrained by the single-column list. To make the page use the full width:

- Keep the existing flex layout; the list surface and rows already stretch — the perceived narrowness comes from `main` padding and the row grid. Widen by reducing padding on large screens (`lg:px-6`) is NOT needed; instead the fix is removing any max-width constraint and letting the card span the full available width (it already does via flex-1). The real cause of the "not full width" feel is the 4-column grid — we'll switch subject chips to a compact dropdown (change 3), freeing horizontal space, and keep the card full-bleed within the padded main.
- Verify in preview at desktop width that the card spans edge-to-edge of the content area (same as `/students-list`). If a stray `max-w-*` or the old `#root` cap is found affecting this page, remove/override it.

## 2. One colour per subject category

Replace the per-index cycling of `avatarTones` for subject chips with a stable category → pastel mapping (consistent with the calendar's year-group colouring):

- 11 Plus → pastel-lilac
- KS2 (incl. Early KS2, Sats) → pastel-mint
- KS3 → pastel-sky
- GCSE (incl. Year 11) → pastel-butter
- A-level → pastel-blush
- Other/unmatched → pastel-sand

Implementation: small `getSubjectCategoryTone(subject: string)` helper in `Tutors.tsx` (prefix matching, same rules as the existing `subjectGroups.ts`/calendar mapping). Avatar initials chips keep their current rotation — only subject chips change.

## 3. Subject dropdown per tutor row

Rows look busy when a tutor has many subjects. Change the Subjects cell:

- If a tutor has subjects: show a compact dropdown (Popover + trigger button) — trigger is a black-outline rounded-full pill showing e.g. "4 subjects" with a chevron; opening it lists the subject chips inside a rounded pastel popover, each chip using its category colour from change 2.
- If no subjects: keep the muted "N/A" chip as-is (no dropdown).
- Purely presentational; no changes to data or to the Active/Inactive classification.

## Verification

- `tsgo` typecheck + build log.
- Preview `/tutors`: full-width card, category colours consistent per subject, dropdown opens/closes, all four action buttons and dialogs still work, tabs and pagination unchanged.
