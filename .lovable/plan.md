# Revision Notes (flashcards) on Lesson Summaries

Replace the "Assessment" button on each lesson card with a "Revision Notes" button that opens an AI-generated flashcard deck for that lesson, built from the lesson transcript and focused on the student's areas of weakness.

## What the user sees

- Each lesson card on `/lesson-summaries` shows: Recording | Summary | **Revision Notes**.
- Clicking Revision Notes opens a dialog:
  - If the lesson has more than one student, a small student picker at the top (staff and parents see the students they can access; a student sees only their own set).
  - A flashcard deck: one card at a time, tap/click to flip between question and answer, next/previous controls, a progress counter, and a "Shuffle" and "Restart" control.
  - Each card is tagged with the weakness area it targets and a difficulty (easy / medium / hard).
- First time it's opened for a lesson+student, it generates the deck (spinner with "Building your revision notes..."), then saves it so later opens are instant. A "Regenerate" action re-creates the deck.
- If no transcript exists yet, the dialog explains that revision notes become available once the lesson transcript has processed, instead of generating a generic deck.

## How the cards are built

Source of truth is the lesson transcript (`lesson_transcriptions.transcription_text`), narrowed by the student's summary:

1. Read the student's `lesson_student_summaries` row for `areas_for_improvement`, `topics_covered`, and `what_went_well`.
2. Feed the transcript plus those weakness areas to the model and ask for 8–12 flashcards that drill specifically the concepts the student struggled with, using wording, examples and numbers that actually appeared in the lesson.
3. Every card records: front (question/prompt), back (answer/explanation), the weakness area it targets, and a difficulty.
4. Absent students (attendance marked as missed) get a deck built from the lesson's topics rather than personal weaknesses, with a note saying so.

## Technical notes

- New table `lesson_revision_notes`: `lesson_id`, `student_id`, `cards` (jsonb array), `source` ('transcript'), `generated_at`, timestamps, unique on (lesson_id, student_id). RLS + grants matching the existing `lesson_student_summaries` access rules (students see their own, parents their children's, tutors their lessons, admins/owners all).
- New edge function `generate-revision-notes`: takes `lessonId` + `studentId`, validates the caller's JWT and access, loads transcript + student summary, calls OpenAI (`gpt-4o`, JSON schema output) with the existing `OPENAI_API_KEY`, upserts the row and returns the deck. Errors are surfaced with their real status, no silent fallback deck.
- New components under `src/components/learningHub/`: `RevisionNotesDialog.tsx` (student picker, load/generate/regenerate) and `FlashcardDeck.tsx` (flip + navigation UI, pastel styling consistent with the current cards).
- `LessonSummaryCard.tsx`: swap the Assessment button and its transcript-warning/assessment-generation wiring for the Revision Notes button (purple accent, brain/cards icon) opening the new dialog. Assessment generation stays available where it already exists elsewhere; it is removed from this card.
