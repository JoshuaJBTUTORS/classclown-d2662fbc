## What exists today (verified)

`src/components/calendar/LessonDetailsDialog.tsx` line 724 renders a **Send Proposal** button, shown only when `lesson.lesson_type === 'demo'` and the user can edit lessons. It builds a query string with `name`, `email`, `phone`, `subject` from the first student and navigates to `/admin/proposals/create`.

`src/pages/ProposalBuilder.tsx` reads exactly those four query params into its form defaults. Everything else — lesson type, price per lesson, payment cycle, contract term, and the entire `lessonTimes` array (day, time, duration, subject per session) — starts blank and is typed in manually.

The transcript for the trial I examined contains every one of those missing fields, spoken aloud in the discovery conversation.

## Plan

### 1. Extend the calendar's Send Proposal button

Keep the same button and the same destination. Changes:

- Show it for `lesson_type === 'demo'` **and** `'trial'` — the discovery conversation happens on trials too.
- Before navigating, check whether the lesson has a transcript. If it does, the button opens a small prep step instead of jumping straight to the blank form; if it does not, it behaves exactly as it does now.

### 2. Prep step: extract from the transcript

Clicking Send Proposal on a lesson with a transcript opens a dialog inside the calendar that runs extraction and shows the result for review. It carries the booking context the calendar already has (lesson id, student, subject, tutor, date) plus everything pulled from the transcript:

- recipient name, email, phone, student name, year group
- subjects, with exam board per subject where stated
- lesson format (1:1 or group) and lessons per week
- preferred days and times, blocked days, any rotation pattern
- contract term discussed and price per lesson quoted
- notes: commitments made, open questions, objections

Each field shows the value next to the verbatim transcript quote it came from, with the timestamp. Low-confidence or missing fields are flagged amber. Booking data from the calendar wins over transcript data on conflict for the fields the booking already knows (student name, subject, tutor), since that is the confirmed record.

### 3. Prefill the builder

**Use for proposal** navigates to `/admin/proposals/create` as today, but passes the reviewed draft through router state rather than a query string, so the full `lessonTimes` array survives. `ProposalBuilder` reads that state when present and falls back to the existing query-param behaviour when absent — no regression for any other entry point.

Prefilled: recipient details, lesson type, subject, price per lesson, payment cycle, contract term, and one `lessonTimes` row per weekly session with day, time, duration and subject. The admin still reviews and presses send; nothing is created automatically.

For the example trial that means the builder opens with 3-month term, £24 per lesson, and two weekly weekday 19:00 rows — Maths, plus the rotating second subject.

### 4. Handle the messy parts

- Speaker labels are unreliable (the account manager's whole segment is attributed to the tutor), so the prompt infers roles from content, never from names.
- One LessonSpace `session_id` is attached to many lesson rows, so a transcript can contain other sessions. The prompt is told to extract only the discovery conversation matching this booking's student, and to say so when it cannot find one.
- Diarization garbles spelled-out emails and names, so those default to low confidence and are always flagged for manual confirmation.
- Quoted prices are checked against the standard rate card in the review dialog, so a misheard figure is caught before it reaches a client.

## Technical notes

- New edge function `draft-proposal-from-transcript`: takes a lesson id, reads `lesson_transcriptions`, flattens the segment JSON into speaker-labelled text with timestamps, calls the model with a JSON-schema response format, returns the structured draft. Read-only, no writes.
- Model: `google/gemini-3.6-flash` via the Lovable AI Gateway; a transcript of this size fits one call, with chunk-and-merge for longer ones.
- Frontend: new review dialog component under `src/components/calendar/`, wired into the existing button in `LessonDetailsDialog.tsx`; `ProposalBuilder.tsx` gains router-state prefill alongside its current query-param defaults.
- No schema change. No change to `create-lesson-proposal` or the send flow.
