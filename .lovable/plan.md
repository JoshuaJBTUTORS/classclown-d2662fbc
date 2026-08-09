# Rebuild a subject's lesson plan from a PDF

Add a "Rebuild from PDF" tool inside the lesson plan dialog (e.g. GCSE Combined Science). You upload the official scheme-of-work PDF, the AI compares it against the existing weekly plan, and the plan is rewritten automatically to match.

## What the button does

1. Sits in the subject dialog header (admins/owners only), next to the subject title.
2. Opens a small dialog: choose the PDF for this subject, press Rebuild.
3. The PDF plus every existing week for that subject is sent to GPT-5.6 Sol.
4. The AI returns a full corrected week-by-week plan, which is written straight back to the subject (auto-apply), then the dialog refreshes.
5. A progress state is shown while it runs (typically 1-3 minutes), with a clear error if it fails.

## Rules the AI must follow

1. Remove any week without a clear learning outcome (revision, retrieval practice, catch-up, consolidation, "TBC").
2. Treat the PDF as the source of truth for topic order, naming and lesson structure; existing wording is only kept where it matches the PDF.
3. Force these four weeks to be assessment weeks, overwriting whatever sat there:
   - Week 9 (26 October 2026)
   - Week 22 (25 January 2027)
   - Week 35 (26 April 2027)
   - Week 48 (26 July 2027)
4. Remove or reword anything that can't be run online — required practicals become demonstrations, simulations, or analysis of provided results, never "carry out the experiment".

## Week numbering

Week numbers stay fixed to the calendar. When a week is deleted, the later topics shift up into the freed slot so the sequence stays continuous, but the four assessment weeks above always keep their number. The term label for each week is preserved from the slot it occupies.

## Technical detail

- New edge function `rebuild-lesson-plan-from-pdf`:
  - Input: `subject`, PDF as base64.
  - Loads all `lesson_plans` rows for the subject (week number, term, title, description).
  - Calls the Lovable AI Gateway Responses API with `openai/gpt-5.6-sol`, streaming, PDF attached as a file input, with the four rules above in the instructions and a strict JSON schema for the output (`weeks[]` of `week_number`, `term`, `topic_title`, `description`, plus a `changes[]` summary).
  - Applies the result in one pass: updates existing rows by week number, inserts missing weeks, deletes weeks the AI dropped.
  - Returns the change summary.
- Frontend: `RebuildPlanFromPdfDialog` component used by `SubjectDetailDialog`; file input restricted to PDF, size-capped, and the returned change list shown as a toast/summary panel after it applies.
- No schema changes; only `lesson_plans` rows for the selected subject are touched.

## Caveats

- Auto-apply overwrites the subject's current weeks — there's no undo, so the run is scoped to one subject at a time.
- Uploaded materials (`teaching_materials`) stay attached to their week numbers and are not moved.
