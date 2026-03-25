

## Add Daily Homework Practice Option to Proposals

### Summary
Add a "Daily Homework Practice" toggle (£12.99/month displayed, but not charged) to both the admin proposal creation form and the public-facing proposal view. On the admin side, it's a pre-set option. On the public proposal view, if not already selected, a prompt appears asking the recipient if they'd like to add it.

### Database Change
**New migration** — add a `daily_homework_opt_in` boolean column to `lesson_proposals`:
```sql
ALTER TABLE lesson_proposals ADD COLUMN daily_homework_opt_in boolean DEFAULT false;
```

### Changes

**1. ProposalBuilder.tsx (admin create form)**
- Add `dailyHomeworkOptIn` boolean field to the form schema (default `false`)
- After the Lesson Times section, add a styled card/row with:
  - Checkbox: "Include Daily Homework Practice"
  - Description: "Daily homework assignments across all subjects"
  - Price badge on the right: "£12.99/mo" (display only, greyed/muted to indicate informational)
- Pass `dailyHomeworkOptIn` to the edge function body

**2. create-lesson-proposal edge function**
- Add `dailyHomeworkOptIn` to the `ProposalRequest` interface
- Include `daily_homework_opt_in` in the insert payload

**3. update-lesson-proposal edge function**
- Add `dailyHomeworkOptIn` to the `UpdateProposalRequest` interface
- Include `daily_homework_opt_in` in the update payload

**4. ProposalView.tsx (public proposal page)**
- Read `daily_homework_opt_in` from the proposal data
- If `true`: show a "Daily Homework Practice — £12.99/mo" line item in the Investment section with a checkmark (already included)
- If `false`: before the "Get Started" button, show a highlighted card:
  - "Would you like to add daily homework assignments for all subjects?"
  - Yes/No buttons, with "£12.99/mo" shown alongside
  - Selecting "Yes" updates `daily_homework_opt_in` to `true` on the proposal record via Supabase
  - Selecting "No" dismisses the card and continues

**5. AgreementStep.tsx**
- No functional change needed — the opt-in is already recorded on the proposal before reaching this step

### Files Modified
- New migration SQL file (add `daily_homework_opt_in` column)
- `src/pages/ProposalBuilder.tsx` — add checkbox field
- `supabase/functions/create-lesson-proposal/index.ts` — pass new field
- `supabase/functions/update-lesson-proposal/index.ts` — pass new field
- `src/pages/ProposalView.tsx` — display or prompt for homework opt-in

