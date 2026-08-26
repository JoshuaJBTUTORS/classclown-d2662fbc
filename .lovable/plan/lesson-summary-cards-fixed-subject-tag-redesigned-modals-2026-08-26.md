# Lesson summary cards: fixed subject tag + redesigned modals

## Subject tag placement

On `LessonSummaryCard`, the subject badge currently sits in a wrapping flex row, so on narrower cards it drops underneath the meta lines (as circled in the reference). Pin it to the card's top-right corner as an absolutely positioned pill (`absolute right-6 top-6`), with the title/meta block reserving right padding so long titles never run under it. Long subject names truncate with a max width instead of pushing the layout.

## Modal redesign (Recording, Summary, Revision Notes)

All three dialogs adopt the pastel design language used by the cards and hero:

- Soft container: `rounded-[var(--radius-soft)]`, `shadow-[var(--shadow-soft-lg)]`, no hard borders.
- Header: pastel band tinted with the lesson's own `getPastelTone` colour, a `ScribbleStroke` tiger-stripe motif in the top-right, heading in Plus Jakarta Sans extrabold, and a subtitle line with date, tutor and subject pill.
- Body on a clean `bg-card` surface with generous padding; all controls become pill-shaped (`rounded-full`, `h-11/h-12`) matching the card action buttons.

Per modal:

- **Recording** — pastel header, the player in a rounded, overflow-hidden frame; the "no recording"/"loading" states become a dashed pastel empty panel with a rounded icon chip, matching the school-progress empty state.
- **Summary** — pastel header, student summaries laid out as rounded pastel info blocks with pill section labels; keeps existing `StudentLessonSummary` content, restyled wrapper.
- **Revision Notes** — pastel header, student picker as pill toggles (filled dark pill for the selected student), loading/notice states as the same dashed pastel panel, and "Regenerate" as a pill ghost button in the footer. Flashcards themselves get the pastel tone treatment: soft rounded card, stripes motif, pill difficulty/weakness tags, and pill navigation controls.

## Technical notes

- Files: `src/components/learningHub/LessonSummaryCard.tsx` (badge position + Recording/Summary dialog markup), `src/components/learningHub/RevisionNotesDialog.tsx`, `src/components/learningHub/FlashcardDeck.tsx`.
- Reuse `getPastelTone` from `src/components/lessonPlans/pastelPalette.ts` and `ScribbleStroke`; pass the lesson tone into the dialogs so each lesson's modals match its card colour.
- Semantic tokens only — no hardcoded colours; purple accents on Revision Notes swap to the tone/foreground tokens.
- No data, query, or edge-function changes.
