-- Fix remaining lesson time mismatches after DST transition
-- Part 1: Fix lessons that are 2 hours early (need +2 hours)
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

-- Part 2: Fix lessons that are 1 hour late (need -1 hour)
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