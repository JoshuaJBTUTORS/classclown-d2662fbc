## Goal

When Agent drafts a proposal from a trial transcript, it should recognise the student's year group and output subjects using our system's naming (e.g. "11 Plus Maths", "Sats English", "KS3 Science", "GCSE Biology") instead of free text like "Maths".

## Mapping to teach it

| Year group | System band | Example subjects |
|---|---|---|
| Year 3-4 | Early KS2 | Early KS2 Maths / English |
| Year 5-6 (11+ prep) | 11 Plus | 11 Plus Maths, 11 Plus English, 11 Plus VR, 11 Plus NVR |
| Year 5-6 (school support) | KS2 / Sats | KS2 Maths, KS2 English, Sats Maths, Sats English |
| Year 7-9 | KS3 | KS3 Maths, KS3 English, KS3 Science, KS3 Geography |
| Year 10-11 | GCSE | GCSE Maths (Higher/Foundation), GCSE English, GCSE Combined Science, GCSE Biology/Chemistry/Physics, GCSE Geography, GCSE Business, GCSE Economics, GCSE Computer Science |
| Year 12-13 | A-level | A-level Maths, Biology, Chemistry, Physics, Computer Science, Geography, Business, Economics |

Rules: Year 5/6 defaults to KS2/Sats unless the parent mentions 11 plus, entrance exams, grammar or independent school — then use the 11 Plus subjects. Year 9 is treated as KS3. Where a year group is never stated, infer it from age/school mentions and mark it low confidence.

## Changes

1. **`supabase/functions/draft-proposal-from-transcript/index.ts`**
   - Add a canonical subject list (mirroring `src/constants/subjects.ts`) and the year-group mapping table above into the system prompt.
   - Instruct the model to: normalise `year_group` to "Year N" form, and to write every `subjects` value and every `lesson_times[].subject` using an exact name from the canonical list, prefixed for the correct band.
   - Add a `year_band` field to the output (ks2 / 11_plus / ks3 / gcse / a_level) with quote + confidence, so the reviewer can see what the AI assumed.
   - Use the student's `grade` from the booking record as the authoritative year group when present (same "booking record wins" treatment already used for name/email/phone), and pass the mapping-derived band in the booking context.
   - Post-process: if a returned subject isn't in the canonical list, keep the AI text but flag it (confidence downgraded to low) rather than silently dropping it.

2. **`src/components/calendar/TranscriptProposalDialog.tsx`**
   - Show the new "Year band" row alongside "Year group" in the extracted-fields list so the admin can spot a wrong assumption (e.g. 11 Plus vs KS2) before sending.

3. **Redeploy** the `draft-proposal-from-transcript` edge function.

No database or proposal-schema changes; subjects stay free-text strings, they are just now written in our house naming.
