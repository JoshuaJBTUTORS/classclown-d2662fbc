# Redesign /admin/proposals in the ClassClown design language

Visual-only refresh of the proposals dashboard and its modals. No changes to data loading, filters, actions, permissions, or routing.

## Page shell
- Replace the narrow `container` + top sidebar-trigger bar with a full-width flex shell (`min-w-0 w-full flex-1`) so the page uses the whole screen, matching `/students`, `/tutors`, `/trial-bookings`.
- Keep the existing `AdminProposalSidebar` and its trigger, restyled with the pastel/black-outline treatment.
- Heading row: "Lesson Proposals" title with a count pill, and the Create Proposal action rendered as the shared black pill button (same pattern as the calendar "Request Topic" chip / `/students` header buttons).

## List
- Swap the bordered table for the pastel card surface with rounded rows used on `/students-list`: initials avatar, recipient name + email, subject and lesson type chips, price, sent date, status chip.
- Status colours from the design palette: draft sand, sent sky, viewed lilac, agreed mint, completed mint (solid), declined blush.
- Row actions (resend, extend offer, edit, copy link, open, delete) stay exactly the same set and order, restyled as rounded black-outline icon buttons with tooltips preserved; delete keeps the red tone.
- Search input and status select restyled as rounded outlined controls; keep current filtering logic and the "Showing X of Y" footer line.
- Add matching loading, empty ("No proposals created yet") and no-match states in the new style.

## Modals
- `ExtendOfferDialog`: restyle header, quick-extend buttons, custom date field, and footer to the design language (rounded surface, black outline, pill buttons). Same quick options, same save logic.
- Delete confirmation: replace the browser `confirm()` with a styled AlertDialog carrying the same wording and the same delete outcome — no new steps or options.

## Technical notes
- Files: `src/pages/admin/ProposalDashboard.tsx`, `src/components/proposals/ExtendOfferDialog.tsx`, `src/components/admin/AdminProposalSidebar.tsx`.
- Reuse existing doodle icon and chip helpers already in the project rather than introducing new design primitives.
- Verify with `bunx tsgo --noEmit -p tsconfig.app.json` and the build log.
