# Proposal notes: heading cleanup + onboarding fix

## 1. Remove the "Options & notes" heading
In the proposal creation form, the section heading above the internal notes box is removed. The internal notes field itself stays exactly as it is.

## 2. Internal notes not showing on /onboarding
Confirmed cause: when onboarding loads the selected completed proposal, the query asks the database for a fixed list of fields and `internal_notes` is not one of them. The screen therefore always falls back to "No internal notes on this proposal." Adding the field to that query makes the notes appear.

## Technical details
- `src/components/proposals/ProposalForm.tsx` line 491: delete the `<h2>Options &amp; notes</h2>` line (keep the section wrapper and the `internalNotes` field).
- `src/pages/Onboarding.tsx` line 172: add `internal_notes` to the `lesson_proposals` select list.

No database or edge function changes needed — the column already exists and is written by create/update proposal functions.
