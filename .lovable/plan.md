

## Fix: Correct 8 Remaining Lesson Time Mismatches This Week and Future

### What's wrong

After the previous migrations, 8 specific lessons this week still don't match last week's correct times. Two distinct problems:

1. **4 lessons are 2 hours early** -- these were likely shifted -1h by the first migration, then missed by the +1h correction (or were double-shifted). They need +2 hours.
2. **3 lessons are 1 hour late** -- these were likely over-corrected by the +1h migration. They need -1 hour.

### The fix

A single SQL migration with two targeted updates:

**Part 1: Fix lessons that are 2 hours early**
```sql
UPDATE lessons l2
SET start_time = l2.start_time + INTERVAL '2 hours',
    end_time = l2.end_time + INTERVAL '2 hours'
WHERE l2.start_time >= '2026-03-29'
  AND l2.status != 'completed'
  AND EXISTS (
    SELECT 1 FROM lessons l1
    WHERE l1.title = l2.title
      AND l1.tutor_id = l2.tutor_id
      AND l1.start_time >= '2026-03-22' AND l1.start_time < '2026-03-29'
      AND EXTRACT(DOW FROM l1.start_time AT TIME ZONE 'Europe/London')
        = EXTRACT(DOW FROM l2.start_time AT TIME ZONE 'Europe/London')
      AND EXTRACT(EPOCH FROM
            (l1.start_time AT TIME ZONE 'Europe/London')::TIME
          - (l2.start_time AT TIME ZONE 'Europe/London')::TIME
        ) / 3600 = 2
  );
```

**Part 2: Fix lessons that are 1 hour late**
```sql
UPDATE lessons l2
SET start_time = l2.start_time - INTERVAL '1 hour',
    end_time = l2.end_time - INTERVAL '1 hour'
WHERE l2.start_time >= '2026-03-29'
  AND l2.status != 'completed'
  AND EXISTS (
    SELECT 1 FROM lessons l1
    WHERE l1.title = l2.title
      AND l1.tutor_id = l2.tutor_id
      AND l1.start_time >= '2026-03-22' AND l1.start_time < '2026-03-29'
      AND EXTRACT(DOW FROM l1.start_time AT TIME ZONE 'Europe/London')
        = EXTRACT(DOW FROM l2.start_time AT TIME ZONE 'Europe/London')
      AND EXTRACT(EPOCH FROM
            (l1.start_time AT TIME ZONE 'Europe/London')::TIME
          - (l2.start_time AT TIME ZONE 'Europe/London')::TIME
        ) / 3600 = -1
  );
```

Both queries use the same safe matching logic (title + tutor + day-of-week + exact hour difference) and apply to this week and all future occurrences.

### Risk
- Low. Same pattern as the previous successful migration, targeting only lessons with a verified last-week counterpart at the exact expected offset.
- No other lessons are touched.

