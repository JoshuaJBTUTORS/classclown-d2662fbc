-- Fix: Shift 346 future lessons forward by 1 hour to match last week's correct times
-- Only affects lessons that have a verified correct counterpart from last week (March 22-28)
-- and are exactly 1 hour behind in UK time

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