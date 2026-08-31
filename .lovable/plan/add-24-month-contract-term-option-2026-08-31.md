# Add 24-month contract term option

Add a **24 Months** option to the proposal contract term across the database, the proposal create/edit forms, the public proposal view, transcript-derived proposal drafts, and the relevant edge functions.

## Database

Migration to widen the existing CHECK constraint `lesson_proposals_contract_term_check` (currently `'month_to_month','3_months','12_months'`) so `24_months` is a valid value:

```sql
ALTER TABLE public.lesson_proposals DROP CONSTRAINT lesson_proposals_contract_term_check;
ALTER TABLE public.lesson_proposals ADD CONSTRAINT lesson_proposals_contract_term_check
  CHECK (contract_term IN ('month_to_month','3_months','12_months','24_months'));
```

## Frontend

- `src/components/proposals/ProposalForm.tsx`
  - zod enum `contractTerm`: add `'24_months'`.
  - Contract Term `<Select>`: add `<SelectItem value="24_months">24 Months</SelectItem>`.
- `src/components/proposals/ProposalLayout.tsx`
  - `contract_term` type union: add `'24_months'` (line 40).
  - Label mapping (line 489): handle `24_months` → `'24 Months'`.
  - Cancellations sentence (line 597): handle `24_months` → `'24 months'`.
- `src/pages/admin/EditProposal.tsx` (line 74): add `'24_months'` to the cast union.
- `src/pages/ProposalBuilder.tsx` (line 29): add `'24_months'` to the prefill type.
- `src/components/calendar/TranscriptProposalDialog.tsx`
  - `contractTerm` type (line 51) and `normaliseTerm` return type (line 86): add `'24_months'`.
  - `normaliseTerm` body: add `if (v.includes('24')) return '24_months';`.

## Edge functions

- `supabase/functions/create-lesson-proposal/index.ts` (line 21): add `'24_months'` to the `contractTerm` union type.
- `supabase/functions/update-lesson-proposal/index.ts` (line 15): add `'24_months'` to the `contractTerm` union type.
- `supabase/functions/draft-proposal-from-transcript/index.ts` (line 120): update the prompt text listing valid values to include `24_months`.

## Verification

Run typecheck + build after edits; open `/admin/proposals/create` to confirm the new option renders and selects, and that a 24-month proposal saves without a constraint error.
