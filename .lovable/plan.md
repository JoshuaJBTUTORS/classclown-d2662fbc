## Goal
Add an internal-only notes field when sending a lesson proposal, and surface those notes in Step 2 of Cleo Onboarding so they aren't missed.

## Database
Add a nullable `internal_notes text` column to `public.lesson_proposals` (migration). Existing grants/RLS unchanged. The column is never rendered on the public proposal page (`ProposalView` / `ProposalLayout`), so recipients never see it.

## Proposal Builder (`src/pages/ProposalBuilder.tsx`)
- Add an optional `internalNotes` textarea to the form schema and layout, labelled "Internal notes (not shown to the client)".
- Pass `internalNotes` through to the `create-lesson-proposal` edge function payload.

## Edge functions
- `create-lesson-proposal`: accept `internalNotes` and store it as `internal_notes` on insert.
- `update-lesson-proposal`: accept and update `internal_notes` so edits from the admin proposal edit flow persist.

## Onboarding Step 2 (`src/pages/Onboarding.tsx`)
- Add `internal_notes` to the `Proposal` interface (proposal rows are already fetched with `select('*')`, so no query change).
- In Step 2, above the Sessions list, render a highlighted "Internal notes from the proposal" panel showing the notes. If there are none, show a muted "No internal notes on this proposal."

## Notes
Notes are display-only during onboarding; no editing there.
