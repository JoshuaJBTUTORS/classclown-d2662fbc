# Programme Start Date & Programme Terms on Proposals

Add a Programme Start Date to every proposal and surface a full set of programme terms in the client-facing proposal and the agreement the client signs.

## 1. Programme Start Date field

- New required date field "Programme Start Date" in the proposal builder (`/admin/proposals/create`) and the edit proposal page, using the standard date picker.
- Stored on the proposal record as a new `programme_start_date` column, saved by both the create and update proposal functions.
- Existing proposals without a date simply show nothing extra.

## 2. Programme Term field

The proposal form already has a contract term selector (month to month / 3 / 12 / 24 months). This becomes the "Programme Term" field — same options, relabelled. No duplicate field.

## 3. Client-facing proposal display

Near the top of the proposal (in the hero/summary area), show:

- **Programme Start Date** in large, clear type, with the note:
  "Your programme will begin on this date, and lessons scheduled from this date will form part of your programme unless an alternative start date has been agreed by Class Beyond Academy in writing beforehand."
- **Programme Term**:
  "This agreement is for a minimum term of 3 months, beginning on the programme start date stated above." (term length reflects the selected option)
- **Lesson schedule** — the agreed days, times, durations and subjects (the existing weekly schedule block is referenced here), followed by:
  "Lesson times may occasionally be adjusted by mutual agreement or where operationally necessary."

## 4. New terms sections

Added to the proposal's Terms area and mirrored into the signed agreement text, each with the exact wording supplied:

- Teacher Allocation (both paragraphs)
- Payment (no payment before start; first payment after first lesson)
- Missed Lessons / No-Shows (counts as delivered session + 24 hours notice)
- Class Beyond Academy Cancellations
- Substitute Teachers
- Changing Your Start Date
- Parent / Guardian Responsibility

## 5. Signature confirmation

On the agreement step, directly above the accept checkbox, display:

"By signing below, you confirm that you have reviewed and accepted the programme start date, lesson schedule, minimum term, payment arrangements, cancellation policy and teacher allocation terms."

The signature record continues to store the full agreement text, so the new terms are captured in what the client signs.

## Technical notes

- Migration: `ALTER TABLE public.lesson_proposals ADD COLUMN programme_start_date date;`
- Form: extend `proposalSchema` in `src/components/proposals/ProposalForm.tsx` with `programmeStartDate`; wire defaults in `ProposalBuilder.tsx` and `admin/EditProposal.tsx`.
- Edge functions: persist `programme_start_date` in `create-lesson-proposal` and `update-lesson-proposal`.
- Display: new blocks in `src/components/proposals/ProposalLayout.tsx` (hero + terms section), styled with the existing ClassClown design tokens.
- Agreement: extend `TERMS_AND_CONDITIONS` and add the confirmation statement in `src/components/proposals/AgreementStep.tsx`.
