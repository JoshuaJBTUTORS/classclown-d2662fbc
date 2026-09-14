# Fix: Adi Abrol's account shows an empty calendar

## What's actually wrong

Adi's login (adityabrol2012@gmail.com) is tagged with two roles on the account: **student** and **parent**. The app always picks the more senior of the two, so it treats Adi as a parent. It then looks for a parent record with Adi's email, finds none (the parent record belongs to Varuna, vabrol1489@hotmail.co.uk) and shows nothing.

The lessons themselves are fine: Adi is linked to 349 lessons, 42 of them still upcoming. Nothing is missing from the schedule — the account is just looking in the wrong place.

## The fix

1. **Correct Adi's account** — remove the stray "parent" tag so the account is a student only. The calendar then loads Adi's own lessons straight away.
2. **Stop this happening again** — when an account is treated as a parent but no parent record matches, fall back to loading that person's own student lessons instead of showing an empty calendar.
3. **Check the rest** — list any other logins carrying both a student and a parent tag, and report them so we can decide case by case (no bulk changes without your say-so).

## Technical detail

- Delete the `user_roles` row `role = 'parent'` for user `ebbefec5-f164-4bed-a413-29e9c4d693e8` (keep the `is_primary` student row).
- `src/hooks/useCalendarData.ts`, parent branch: when the `parents` lookup by email returns nothing, retry the student branch (`students` by email / `user_id`) before setting an empty lesson list. Same fallback when the parent has no linked children.
- No schema or RLS changes; `lessons` and `lesson_students` already allow authenticated reads.
- Audit query: users with both `student` and `parent` rows in `user_roles`, reported in chat only.
