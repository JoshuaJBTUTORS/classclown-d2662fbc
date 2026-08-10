# The 32 borderline series: booked date vs attended date

## What the two dates mean

- **Last booked** — the latest slot that exists on the calendar for that series (the parent lesson or any of its repeats). It says a lesson was *meant* to happen then. It does not say anyone turned up.
- **Last attended** — the latest slot where attendance was actually marked as present, late or attended. This is proof the client was still engaged.

Where the two are far apart, the calendar kept generating slots long after the client stopped showing up.

## The list (today: 10 Aug 2026)

| Series | Tutor | Last booked | Last attended |
|---|---|---|---|
| Alex - 1-1 Year 11 Economics | Iulian Dogarescu | 19 Jun 2026 | 3 Apr 2026 |
| 1-1 A-Level Computer Science | Iulian Dogarescu | 18 Jun 2026 | 11 Jun 2026 |
| 1-1 A-Level Further Maths | Riddhi Dineshkumar | 16 Jun 2026 | 16 Jun 2026 |
| 1-1 A Level Chemistry | Lyba Samar | 13 Jun 2026 | 13 Jun 2026 |
| 1-1 Year 11 Maths Foundation | Scott Renwick | 13 Jun 2026 | 29 Nov 2025 |
| 1-1 KS2 Maths | Fariha Muhith | 13 Jun 2026 | 7 Feb 2026 |
| 1-1 A level Chemistry | Lyba Samar | 12 Jun 2026 | 12 Jun 2026 |
| 1-1 Year 11 Combined Science | Riya Moncy | 12 Jun 2026 | 28 Nov 2025 |
| 11 Plus VR Group | Fariha Muhith | 11 Jun 2026 | 16 Oct 2025 |
| Year 11 Physics Group (RES) | Iulian Dogarescu | 11 Jun 2026 | 13 Nov 2025 |
| 1-1 GCSE Maths/English | Riya Moncy | 11 Jun 2026 | 9 Oct 2025 |
| 1-1 A-Level Chemistry | Riddhi Dineshkumar | 10 Jun 2026 | 10 Jun 2026 |
| Year 11 English Group | Britney Lawrence | 7 Jun 2026 | never |
| Year 11 English Group | Annabel Smith | 7 Jun 2026 | 12 Oct 2025 |
| KS2 Maths | Fariha Muhith | 6 Jun 2026 | 6 Sep 2025 |
| Early KS2 English Group | Annabel Smith | 6 Jun 2026 | 29 Nov 2025 |
| 1-1 Year 11 Maths/English | Riya Moncy | 6 Jun 2026 | 6 Jun 2026 |
| GCSE Chemistry Group | Musa Thulubona | 5 Jun 2026 | 29 Aug 2025 |
| GCSE Maths Group | Joshua Ekundayo | 5 Jun 2026 | never |
| KS2 Maths Group | Britney Lawrence | 3 Jun 2026 | never |
| 1-1 Year 11 Computer Science | Iulian Dogarescu | 2 Jun 2026 | 2 Jun 2026 |
| 1-1 GCSE Science | Annabel Smith | 2 Jun 2026 | 19 Aug 2025 |
| Alex - 1-1 A-Level Economics | Scott Renwick | 2 Jun 2026 | 6 Jan 2026 |
| Rudy & Alex - Year 11 Business 1-1 | Iulian Dogarescu | 2 Jun 2026 | 17 Feb 2026 |
| 1-1 A-Level Chemistry | Daniel Alake | 1 Jun 2026 | 1 Jun 2026 |
| Ziyoda 1-1 English | Riya Moncy | 1 Jun 2026 | 27 Sep 2025 |
| 1-1 Year 11 Combined Science | Annabel Smith | 31 May 2026 | 14 Mar 2026 |
| 1-1 Year 11 Maths | Annabel Smith | 30 May 2026 | 21 Feb 2026 |
| 11 Plus NVR Group | Iulian Dogarescu | 28 May 2026 | 6 Nov 2025 |
| Year 11 Chemistry Group | Olli Glover | 23 May 2026 | 22 Nov 2025 |
| Jake - 1-1 KS2 English/Maths | Olli Glover | 21 May 2026 | 7 May 2026 |
| 1-1 KS3 English | Yolanda Simarga | 12 May 2026 | 16 Dec 2025 |

## What this tells us

- **9 series** have booked and attended dates within a week of each other (Further Maths, both Lyba Chemistry series, Riddhi A-Level Chemistry, Riya Year 11 Maths/English, Iulian Computer Science ×2, Daniel Alake Chemistry, Jake KS2). These genuinely ran until late May/June — a real summer pause is plausible, so they should stay live.
- **20 series** last had a marked attendance more than 90 days ago (several back in Aug–Nov 2025) while slots kept appearing on the calendar until June. On the attendance basis these are finished.
- **3 series** have no attendance record at all, ever (Britney's Year 11 English, Joshua's GCSE Maths Group, Britney's KS2 Maths Group).

## Proposed action

Switch the recency test to **attendance**: retire any series whose last attended session is more than 90 days ago, or which has never had a single attendance marked — that's the 23 above. Leave the 9 recently attended series live.

Retiring means: push the repeat rule 100 years out, mark it non-infinite, and write a cut-off record dated the day after the last attended session with reason `auto-retired: no attendance in 90+ days, no cut-off recorded`. Nothing is deleted; only future generation stops.

## Technical notes

- Attendance is read from `lesson_attendance.attendance_status` in (`present`, `late`, `attended`) joined to `lessons` where `id = parent` or `parent_lesson_id = parent`.
- Retirement writes `recurring_lesson_groups.next_extension_date = 2100-01-01`, `is_infinite = false`, plus a `recurring_lesson_cancellations` row carrying `cancelled_from`.
- Series with zero attendance ever use their last booked date as the cut-off.
- The existing 14-day lookback guard in `extend_recurring_lessons()` already blocks regeneration for anything dormant in the meantime.
