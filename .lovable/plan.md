

## Fix: Shift 346 Future Lessons Forward by 1 Hour to Match Last Week

### What I found

Comparing last week (March 22-28, confirmed correct) to this week and beyond:
- **346 future lessons** are showing 1 hour early (their UK time is 1 hour behind last week's equivalent)
- **85 lessons** this week already have the correct time (no change needed)
- The affected lessons span all days and many tutors/subjects

### The fix

A single SQL update that adds 1 hour to `start_time` and `end_time` for all future non-completed lessons where a matching lesson from last week (same title, tutor, day-of-week) exists and the UK time is exactly 1 hour behind.

```sql
UPDATE lessons l2
SET start_time = l2.start_time + INTERVAL '1 hour',
    end_time = l2.end_time + INTERVAL '1 hour'
WHERE l2.start_time >= '2026-03-29'
  AND l2.status != 'completed'
  AND EXISTS (
    SELECT 1 FROM lessons l1
    WHERE l1.title = l2.title
      AND l1.tutor_id = l2.tutor_id
      AND l1.start_time >= '2026-03-22'
      AND l1.start_time < '2026-03-29'
      AND EXTRACT(DOW FROM l1.start_time AT TIME ZONE 'Europe/London')
        = EXTRACT(DOW FROM l2.start_time AT TIME ZONE 'Europe/London')
      AND EXTRACT(EPOCH FROM
            (l1.start_time AT TIME ZONE 'Europe/London')::TIME
          - (l2.start_time AT TIME ZONE 'Europe/London')::TIME
        ) / 3600 = 1
  );
```

This is precise -- it only touches lessons that have a verified "correct" counterpart from last week and are exactly 1 hour off. Lessons already at the right time (the 85) are untouched.

### What stays the same
- The `extend_recurring_lessons()` function is already DST-aware from the previous fix
- No frontend code changes needed
- No lessons from last week or earlier are modified

### Risk
- Low. The query is self-limiting: it only shifts lessons matched against known-correct last-week data
- Lessons without a last-week equivalent are not touched

