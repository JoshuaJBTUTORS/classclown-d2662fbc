# Tidy the proposals list + redesign the Create Proposal page

## 1. Clean up the proposals list (`/admin/proposals`)

The rows currently look uneven because each column sizes itself independently and values are left-aligned with different text weights.

- Lock the grid so every row lines up with the header: fixed proportional columns and a fixed-width actions column, so the action buttons form one straight right-hand edge.
- Right-align the Price column (header and value) and render prices with tabular figures so all the `£` amounts line up digit-for-digit — no more wobble.
- Centre-align Status and Sent within their columns and give status chips a consistent minimum width so the pills form a neat stack.
- Truncate Subject / Lesson Type on a single line with a tooltip on hover instead of wrapping.
- Even out row height and vertical rhythm, keep the alternating soft surface and hover tint.

## 2. Add pagination

- 10 proposals per page, matching the pattern already used on `/trial-bookings`.
- Previous / Next pill buttons plus "Page X of Y" under the list.
- Page resets to 1 whenever the search text or the status filter changes.
- Replace "Showing N of M proposals" with a range label ("Showing 1–10 of 199").

## 3. Redesign `/admin/proposals/create`

Currently a plain shadcn card. Rebuild the shell and form styling in the ClassClown language, with no changes to fields, validation, submission, prefill or navigation:

- Full-width page shell (no narrow centred container), big extrabold heading "Create Proposal", back control styled as an outlined pill.
- Form grouped into soft pastel section blocks: Recipient details, Lesson details & pricing, Schedule (lesson times), Options & notes.
- Inputs, selects and textareas as rounded controls with black outlines; day/duration rows as tidy aligned grids with the same right-aligned price treatment.
- Lesson-time rows get rounded pastel surfaces with a circular outlined remove button and a pill "Add lesson time" action.
- Footer actions: outlined "Cancel" pill and black "Create & Send Proposal" pill, with the existing loading state.

## Technical notes

- Files: `src/pages/admin/ProposalDashboard.tsx` (alignment + pagination), `src/pages/ProposalBuilder.tsx` and `src/components/proposals/ProposalForm.tsx` (visual redesign only).
- Pagination is client-side over the already-filtered array; no query changes.
- No changes to form schema, handlers, edge-function calls (`create-lesson-proposal`), permissions, or routing.
