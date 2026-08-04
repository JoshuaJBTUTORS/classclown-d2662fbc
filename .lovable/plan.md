# Bring Edit Proposal back in line with Create Proposal

The create page has moved on and the edit page was left behind. Right now editing a proposal silently strips fields that were set at creation.

## What's drifted today

| Field | Create | Edit |
| --- | --- | --- |
| Per-session price (each lesson row) | Yes | No — single "Price Per Lesson" box for the whole proposal |
| Daily Homework Practice opt-in (£12.99/mo) | Yes | Missing |
| Internal notes (staff only, shown in Cleo Onboarding) | Yes | Missing |
| Optimise Proposal panel | Yes | Missing |
| Lesson row layout | 5 columns (day, time, duration, subject, price) | 4 columns |

Because edit posts no `dailyHomeworkOptIn` and no per-row prices, saving an edit wipes the homework opt-in and flattens every session back to one price.

## The fix

Extract the shared form into one component, `src/components/proposals/ProposalForm.tsx`, and have both pages render it. That way the two can't drift again.

- The shared form owns the schema, the lesson-time rows (with per-row price), the contract term block, the homework opt-in, the internal notes field and the Optimise panel.
- `ProposalBuilder` passes prefill values (from the calendar or the transcript drafter) and renders a "Create & Send Proposal" button.
- `EditProposal` loads the existing proposal, maps it into the same shape, and renders "Save Changes" plus the existing "Save & Resend" button.

## Handling old proposals

Proposals created before per-session pricing have no `price` on their lesson rows. When editing one, each row falls back to the proposal's stored `price_per_lesson` (or 45 if that's missing too), so nothing shows as £0.

## Technical notes

- New file: `src/components/proposals/ProposalForm.tsx` holding `proposalSchema`, `ProposalFormData`, the lesson-time row editor and all form fields. Props: `defaultValues`, `onSubmit`, `isSubmitting`, `submitLabel`, and an optional `extraActions` slot for the edit page's resend button.
- `src/pages/ProposalBuilder.tsx` and `src/pages/admin/EditProposal.tsx` reduce to data loading, submit handlers and navigation.
- Edit's submit mirrors create: filter to rows with day + time + subject, derive the legacy `pricePerLesson` column as the minimum row price, and send `dailyHomeworkOptIn` and `internalNotes`.
- `update-lesson-proposal` already accepts `dailyHomeworkOptIn`, `internalNotes` and `contractTerm`, and stores `lessonTimes` as JSON, so per-row `price` persists with no backend change. Its `UpdateProposalRequest` type gains `price` on the lesson-time entries for accuracy.
- Edit keeps its own load/reset and "Save & Resend" logic; only the form body is shared.
