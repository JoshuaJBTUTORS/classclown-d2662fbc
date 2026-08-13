# Last week's lesson summary failures (Mon 3 – Sun 9 Aug 2026)

## What happened

106 lessons ran last week. 84 produced student summaries; **22 produced none** — so no topics, no homework brief, and nothing for the Sunday HeyCleo sync to pick up. Every one of those 22 lessons had a LessonSpace session, so the sessions did happen; the transcript pipeline is what failed.

Three failure modes, all in the same week:

**A. Transcript never delivered — 16 lessons**
Row stuck in `processing`, no transcript URL, 0 processing attempts. LessonSpace never fired `transcription.finish` and nothing ever polled for it afterwards.
Affected: Demo + Trial GCSE Maths (Abdullah, 4 Aug), GCSE Maths Group (5 Aug), Trial A-level Maths (Folakemi, 6 Aug), 11 Plus NVR Group (6 Aug), KS3 Science Group (6 Aug), Demo + Trial GCSE Chemistry (Dionne, 7 Aug), Early KS2 Maths Group (7 Aug), Trial GCSE Maths (Kian), 1-1 KS2 Maths, Early KS2 English Group, KS3 Math Group, 11 Plus NVR Group (all 8 Aug), GCSE English Group (9 Aug).

**B. Transcript URL arrived but text was never downloaded — 4 lessons**
Row is `available` with a URL, but the URL has since expired, so the text is now unreachable.
Affected: 1-1 Year 11 English Language (3 Aug), Demo + Trial GCSE Combined Science (Kirsty, 5 Aug), Demo Session (Folakemi, 6 Aug), Year 11 English 1-1 (9 Aug).

**C. Transcript downloaded but summary generation gave up — 2 lessons**
Status `error` after 4 attempts, yet the full transcript text is sitting in the database. These are fully recoverable right now.
Affected: KS3 Maths Group (6 Aug, Gregory Dacosta) and Year 11 Foundation Maths Group (6 Aug).

## Why nothing caught it

`hourly-lesson-processing` only inspects lessons that ended in the **last 24 hours**. Once a lesson falls out of that window it is never revisited, whichever way it failed. Summary generation is also fired and forgotten, so a failure leaves no error anywhere and the lesson simply looks like it had no transcript.

## Plan for last week only

1. **Recover the 2 recoverable lessons (mode C)** — re-run summary generation from the stored transcript text and confirm topics and homework briefs appear for both students.
2. **Re-poll LessonSpace for the 16 mode-A lessons** by session id. Anything LessonSpace still holds gets pulled in, summarised, and the brief created.
3. **The 4 mode-B lessons** have expired URLs; attempt the same re-poll, and where LessonSpace no longer serves the transcript, mark them explicitly unavailable rather than leaving them looking pending.
4. **Report the outcome** — a short list of which of the 22 recovered and which are permanently lost, so tutors can be asked for a manual brief only where genuinely needed.
5. **Re-run the weekly HeyCleo sync for week 2026-08-03**, scoped only to the students whose briefs were recovered, so no family is messaged twice.

## Technical notes

- Recovery reuses `generate-lesson-summaries` (`get-transcription` action, then the summary path) — no new AI logic and no schema change needed beyond resetting `processing_attempts` on the two `error` rows.
- The 22 lessons are identified by joining `lesson_transcriptions` against `lesson_student_summaries` for the 3–9 Aug window; a fixed lesson-id list will be used so the run is bounded and repeatable.
- Preventing recurrence (a wider look-back recovery pass and failure visibility) is deliberately out of scope here and can follow once last week is cleaned up.
