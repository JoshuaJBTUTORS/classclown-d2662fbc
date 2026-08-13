# Fix lesson-plan rebuild staying at 30 weeks

## Confirmed diagnosis
- The rebuild dialog currently defaults to 52 and sends `targetWeeks: 52`.
- The latest database rebuild for **11 Plus Maths** updated weeks 1–30 only; it inserted no weeks 31–52. The other 11 Plus plans also remain at 30.
- The edge function accepts whatever number of weeks the model returns. Its response schema does not require 52 items, and it does not check for every requested week before writing. Therefore a 30-week model response is treated as successful.

## Implementation
1. Make the AI response schema dynamic so a 52-week rebuild requires exactly 52 week objects.
2. Validate before any database changes that the response contains every unique week from 1 through the selected target, with no missing, duplicate, or out-of-range week numbers.
3. If validation fails, stop safely with a clear error instead of partially updating or deleting the existing plan.
4. Include the requested and saved week totals in the function response and completion message so the result is explicit.
5. Deploy the corrected `rebuild-lesson-plan-from-pdf` function.
6. Rebuild one affected 11 Plus plan at 52 weeks and verify in the database that weeks 31–52 were inserted and the subject has exactly 52 distinct weeks.

## Technical details
- Keep the existing 52-week selector and term fallback.
- Move/build the JSON schema after `targetWeeks` is parsed, using exact array-length constraints.
- Perform completeness validation before the update/insert/delete loop, preserving the current plan on any invalid AI response.