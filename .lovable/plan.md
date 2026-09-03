# Remove "Daily Homework Practice" option from proposals

Remove the Daily Homework Practice add-on (£12.99/mo) from the proposal creation flow and the client-facing proposal page. Existing data in the database stays untouched; the option simply disappears from the UI.

## What gets removed

1. **Proposal creation/edit form** (`src/components/proposals/ProposalForm.tsx`)
   - Remove the "Include Daily Homework Practice" checkbox card (with £12.99/mo badge) from the "Options & notes" section.
   - Remove the `dailyHomeworkOptIn` field from the form schema.

2. **Form plumbing**
   - `src/pages/ProposalBuilder.tsx` — remove `dailyHomeworkOptIn` from default values and submit payload.
   - `src/pages/admin/EditProposal.tsx` — remove loading `daily_homework_opt_in` into the form and sending it back.

3. **Client-facing proposal page** (`src/components/proposals/ProposalLayout.tsx`)
   - Remove the "Daily Homework Practice included" badge block.
   - Remove the "Add Daily Homework Practice" upsell prompt (Yes, add it / No thanks) shown to unsigned clients.
   - Remove the "Daily Homework Practice: not included" note on signed proposals.
   - Remove the now-unused `homeworkDismissed` state and `daily_homework_opt_in` from the proposal type.
   - `src/pages/ProposalView.tsx` — remove `daily_homework_opt_in` from its local type.

4. **Edge functions** (keep functions stable, drop the field)
   - `supabase/functions/create-lesson-proposal/index.ts` — stop writing `daily_homework_opt_in`.
   - `supabase/functions/update-lesson-proposal/index.ts` — stop writing `daily_homework_opt_in`.

## What stays

- The `daily_homework_opt_in` database column remains (harmless; avoids a destructive migration and keeps `crm-data-feed` output stable for any historical proposals).

## Verification

- `bunx tsgo --noEmit -p tsconfig.app.json` passes.
- Build log shows OK.
