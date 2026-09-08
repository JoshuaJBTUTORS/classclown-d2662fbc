# Show proposal internal notes on /onboarding straight away

## What's happening

The notes are saved correctly — I checked the signed proposals and they do contain notes (e.g. "Year 11 Resit", "Alternating between English and Maths each week").

The problem is where they're shown. The notes only appear on Step 2, and Step 2 only fills in after the parent account has actually been created in Step 1. So while you're picking a proposal in Step 1 — the moment you want to read the notes — nothing is shown. If parent creation fails or you stop before finishing Step 1, you never see them at all.

## The fix

1. Show the internal notes in Step 1, in the small summary card that already appears once a proposal is picked (Name / Email / Phone). If the proposal has no notes, show "No internal notes on this proposal."
2. Keep the existing notes box on Step 2 as-is, so it stays visible while you set up the sessions.

## Technical detail

Single file: `src/pages/Onboarding.tsx`. The Step 1 preview block (around lines 448-454) renders from `selectedProposal`, which already carries `internal_notes` from the existing query — add a notes row there using the same styling as the Step 2 block. No query, schema, or backend change needed.
