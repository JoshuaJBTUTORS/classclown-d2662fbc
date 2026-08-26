# School Progress: fill the empty space

The page currently shows a wide pastel header followed by a thin filter row and a large blank area with only a small "No documents found" line. The result reads as mostly empty white space.

## What changes

1. Tighter, better balanced header
   - Reduce the hero's vertical padding so it doesn't dominate above an empty page.
   - Keep the butter pastel box, scribble motif, document count pill, student picker and black Upload Document button.

2. Designed empty state instead of blank space
   - Replace the bare centred text with a full-width dashed-outline pastel panel that fills the remaining page height.
   - Inside: a soft pastel icon circle, a bold heading, one line of supporting copy, and a black pill "Upload Document" action (only for parents/students).
   - The panel stretches to the bottom of the viewport so there is no dead white area under it.

3. Page shell
   - Make the content column a flex column that grows, so the empty state can expand to the available height.
   - Keep the same horizontal padding as other pages so the hero still spans the full desktop width.

## Technical notes

- `src/components/schoolProgress/SchoolProgressHero.tsx`: reduce `py` values.
- `src/pages/SchoolProgress.tsx`: content wrapper becomes `flex flex-col`, empty-state block becomes a `flex-1` rounded panel using existing pastel tokens and `--shadow-soft`; no new colour values, no logic changes.
