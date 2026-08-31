# High-impact moment detection from lesson transcripts

Agent Cleo already scans yesterday's transcripts each morning for tutor breaches. This adds a second lens to that same scan: spotting moments where a student mentions something that warrants a timely referral or outreach — and emails you, Britney and Hannah a short daily digest.

## What counts as a high-impact moment

Seven categories, detected per student statement:

- Upcoming test, mock, exam, coursework deadline or school event
- A recent or past assessment the student reflects on
- Results: marks, grades, rankings, predicted grades, teacher feedback
- Other academic outcomes: report cards, progress reports, admissions decisions
- Signs support is needed: struggling, falling behind, losing confidence, anxious
- Positive progress: improved grades, confidence, awards, goals hit
- Changes in goals or circumstances: new targets, subject choices, school moves, interviews

## What gets captured per moment

Student name, subject/academic area, moment type, the event or result type, any date or timeframe mentioned, the grade/score/target if stated, the student's reaction or concern level, any support requested or recommended, an urgency rating, and the exact quoted line(s) from the transcript with the lesson date. Every field the AI asserts must be grounded in a quote — moments without direct transcript evidence are discarded rather than reported.

## The daily email

One email at the same 07:00 UK run as the breach scan, to joshua@, britney@ and hannah@classbeyondacademy.io. Deliberately concise: a short list grouped by urgency, one line per moment (student, subject, what happened, when), with the supporting quote underneath in small italics. No moments found means no email. Breaches and moments stay as two separate emails so neither buries the other.

## Where it shows up in the app

Moments are stored so they can be reviewed later, and Agent Cleo can answer questions about them (for example "who has mocks coming up?"). No new banner — the breach banner stays the only interrupt on the Agent Cleo home screen.

## Technical details

- **New table `student_impact_moments`**: lesson/transcript/student/tutor references, `category`, `subject`, `event_type`, `timeframe` (free text) plus `event_date` where a real date is parseable, `grade_or_target`, `student_reaction`, `urgency` (low/medium/high), `recommended_action`, `evidence` (jsonb array of quotes), `status` (new/actioned/dismissed), timestamps. Admin/owner-only RLS via `has_role`, service-role write, GRANTs included.
- **Single AI pass**: `daily-breach-scan` keeps one Gemini 3.7 Flash call per transcript but the prompt and JSON schema widen to return `{ findings: [...], moments: [...] }`. This avoids doubling AI credit spend and keeps the existing scan-log dedup (`breach_scan_log`, one row per transcription) as the single source of truth for "already processed". A `moments_found` column is added to that log.
- **Evidence enforcement in code**: any moment whose `evidence` array is empty, or whose quotes do not appear in the transcript text, is dropped before insert.
- **Student attribution**: the lesson's enrolled students are passed into the prompt so the model names a real student rather than inventing one; unmatched names fall back to the lesson's student list.
- **Second email** built in the same function after the breach email, using the same Resend sender and UK time formatting.
- **No new cron job** — it rides the existing `daily-breach-scan` 07:00 UK schedule.
- Existing circuit breaker is retained: a 402/403 from the AI gateway halts the whole run without marking transcripts as scanned.

## Note on current state

The last test run of the breach scan returned `403 credit_limit_reached` — the workspace AI credit limit is currently blocking all gateway calls. This feature will build and deploy fine, but neither the breach scan nor the moment scan will produce results until a workspace admin raises that limit.
