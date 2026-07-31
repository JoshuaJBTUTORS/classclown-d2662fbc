## What went wrong

In `supabase/functions/draft-proposal-from-transcript/index.ts` the trial booking record is treated as authoritative over the call itself:

- The prompt is fed `"BOOKING CONTEXT (confirmed record, wins over the transcript for student name / subject)"` and a note saying `record_year_group / record_year_band ... are authoritative when present. Use them to pick the banded subject names.` (lines 477-478, 494).
- After extraction, `draft.fields.year_group` is overwritten with the record's value at high confidence, and `resolvedBand` prefers `recordBand` over anything heard in the call (lines 557-572).

So a trial booked as "KS3 Maths" / a stale `students.grade` beats the account manager and parent agreeing the child is in Year 6.

## Changes

All in `supabase/functions/draft-proposal-from-transcript/index.ts`.

1. **Transcript becomes the source of truth for year group, band and subjects.**
   - Reframe the booking context as reference only: it stays authoritative for the parent's name, email and phone, and is demoted to "the trial was booked as X, which may be wrong" for subject/year.
   - Prompt rule: if the call states or implies a year group or school stage, use that, even when it contradicts the booking. Only fall back to `record_year_group` when the call says nothing about the year.
   - Remove the unconditional record override at lines 557-565; apply the record only when the transcript produced no year group. When the two disagree, keep the transcript value and drop confidence to medium so the admin sees a flag.

2. **Capture every subject agreed in the call, not just one.**
   - Change `fields.subjects` from a single string into a list of banded subject names (keeping quote/timestamp/confidence per subject), so a call agreeing Maths and English yields both.
   - Prompt rule: include every subject the parent agreed to on the call, including subjects added after the booked trial subject, and drop any subject the parent declined.
   - Keep the canonical-name validation, applied per subject.

3. **Rebandage subjects against the resolved year.** Prompt rule making it explicit that the band comes from the resolved year group, so a Year 6 child gets `KS2 ...`/`Sats ...`/`11 Plus ...` names even if the trial was recorded as KS3.

4. **Conflict note.** When the booked subject band and the resolved band differ, add a line to `notes` such as "Trial was booked as KS3 Maths but the call places the student in Year 6" so it surfaces in review.

## Review dialog

`src/components/calendar/TranscriptProposalDialog.tsx` renders subjects and the year band; update it to render the subject list (chips, each editable/removable) instead of one string, and show the trial-versus-call conflict note. Subject rows for the lesson times are unchanged.

## Technical notes

- The JSON schema at lines 150-405 is `strict: true`, so `subjects` must be changed to an array of objects with all keys required.
- Downstream prefill into `ProposalBuilder` must join or map the subject list onto the existing proposal `subject` field and per-slot subjects.
- Deploy the edge function after the change.