# Tighten high-impact moment detection

The moment scan is currently reporting almost anything a student says. A review of the 36 stored moments shows what's leaking through.

## What's actually being stored today

Real examples from the table:

- "Tomorrow I'm starting school" — logged as a goal/circumstance change (low)
- "I've just finished writing this application for a promotion" (Army Cadets) — logged twice, once as a goal change, once as an upcoming assessment
- "if I don't get that promotion, I'm going to be very sad" — logged as support needed
- "I don't really remember anything about muscle cells" — logged as support needed
- "I can't see it / I can't write anything on the..." — a screen-share problem logged as support needed
- A cadet drill-and-turnout competition logged as an upcoming assessment

Distribution: 13 of 36 are `support_needed`, 12 are `goal_or_circumstance_change`, and 13 are `low` urgency. Only 2 moments in the whole table are `high`. Almost none have an `event_date`, and several are duplicates of the same conversation.

The pattern is clear: the model is treating any in-lesson remark as a moment. Three things are wrong — the bar is too low, non-academic and technical chatter isn't excluded, and there's no requirement for a concrete, contactable anchor.

## How to tighten it

### 1. A moment must pass a qualification test

Before anything is reported it must satisfy all four:

- **Spoken by the student** (or parent) — not the tutor, not inferred.
- **About something outside this lesson** — a school event, a result, a deadline, a decision. A struggle with the topic being taught right now is the tutor's job, not a moment.
- **Has a concrete anchor** — a named assessment/event, a stated date or timeframe, a grade/target, or a clearly stated school-level concern. No anchor, no moment.
- **Passes the "would we phone home about this?" test** — the recommended action must be something a human would genuinely do this week.

### 2. Hard exclusion list in the prompt

Explicitly not moments: tech/connection/audio/screen-share problems; not remembering or finding a topic hard during the lesson; running late; small talk about weather, holidays, hobbies, pets; non-academic activities (sports clubs, cadets, work promotions) unless they directly affect schooling or wellbeing; generic encouragement; the student simply attending school.

### 3. Narrow the two runaway categories

- **`support_needed`** requires a pattern or a school-level problem — falling behind at school, repeated poor results, stated anxiety or loss of confidence about their education, or a wellbeing concern. Not a single wobble on one topic.
- **`goal_or_circumstance_change`** requires an actual change or decision — new target grade, subject option chosen, school move, exam entry, application submitted, tutoring needs changing. Not routine life updates.

### 4. Score every moment and drop the weak ones

Ask the model for an `impact_score` (0-100) with a short `score_reason`, defined against a written rubric (concreteness of the anchor, time-sensitivity, commercial/pastoral value, evidence strength). Anything under 60 is discarded in code before insert, alongside the existing evidence check. Low urgency is only kept if the score is above the bar.

### 5. Clean up evidence and deduplicate

- Evidence must be the student's own utterance and at least a full clause — the current quotes include long runs of "Yeah. Yeah. Okay." from the transcript. Strip speaker labels and reject quotes that are mostly filler.
- Cap at 2 moments per lesson, keeping the highest scoring.
- Dedupe against moments already stored for the same student in the last 21 days with the same category and a similar event type, so the same mock exam isn't reported every week.

### 6. Second-pass self-check

After the model returns its list, run one short cheap verification call over the candidates only: for each, "does this pass all four qualification rules, yes/no". Anything answered no is dropped. This runs on a handful of short items, not on transcripts, so the added cost is small.

### 7. Email digest reflects the higher bar

With the bar raised, most days will produce zero or one or two moments — which is the point. The digest keeps its current format, grouped by urgency, and simply isn't sent when nothing qualifies.

## Technical details

- All changes are in `supabase/functions/daily-breach-scan/index.ts`. The breach half of the prompt is untouched.
- `MOMENT_POLICY` is rewritten with the qualification test, the exclusion list, the tightened category definitions and the scoring rubric.
- The JSON schema gains `impact_score` (number) and `score_reason` (string).
- New filter chain after parsing: evidence check (existing) → filler-quote rejection → `impact_score >= 60` → per-lesson cap of 2 → 21-day dedupe query against `student_impact_moments`.
- Migration adds `impact_score int` and `score_reason text` to `student_impact_moments` so decisions are auditable and the threshold can be tuned from real data later.
- Optional cleanup: mark the existing 36 rows as `dismissed` so the backlog doesn't muddy Agent Cleo's answers — confirm before running.
