-- ROLLBACK: Remove bonus Cleo minutes that were added (24/11/2025 - 30/11/2025 8pm)
-- This reverses the previous addition by subtracting the same amounts

WITH students_to_update AS (
  -- Part 1: Students WITH accounts - subtract from STUDENT account
  SELECT 
    s.user_id as target_user_id,
    COUNT(DISTINCT l.id) * 10 as minutes_to_remove
  FROM students s
  INNER JOIN lesson_students ls ON s.id = ls.student_id
  INNER JOIN lessons l ON ls.lesson_id = l.id
  WHERE (l.title ILIKE '%GCSE%' OR l.title ILIKE '%Year 11%')
    AND l.start_time >= '2025-11-24 00:00:00'::timestamp
    AND l.start_time < '2025-11-30 20:00:00'::timestamp
    AND s.status != 'trial'
    AND (l.lesson_type IS NULL OR l.lesson_type != 'trial')
    AND s.user_id IS NOT NULL
  GROUP BY s.user_id

  UNION ALL

  -- Part 2: Students WITH accounts - subtract from PARENT account
  SELECT 
    p.user_id as target_user_id,
    COUNT(DISTINCT l.id) * 10 as minutes_to_remove
  FROM students s
  INNER JOIN lesson_students ls ON s.id = ls.student_id
  INNER JOIN lessons l ON ls.lesson_id = l.id
  INNER JOIN parents p ON s.parent_id = p.id
  WHERE (l.title ILIKE '%GCSE%' OR l.title ILIKE '%Year 11%')
    AND l.start_time >= '2025-11-24 00:00:00'::timestamp
    AND l.start_time < '2025-11-30 20:00:00'::timestamp
    AND s.status != 'trial'
    AND (l.lesson_type IS NULL OR l.lesson_type != 'trial')
    AND s.user_id IS NOT NULL
    AND p.user_id IS NOT NULL
  GROUP BY p.user_id

  UNION ALL

  -- Part 3: Students WITHOUT accounts - subtract from PARENT account only
  SELECT 
    p.user_id as target_user_id,
    COUNT(DISTINCT l.id) * 10 as minutes_to_remove
  FROM students s
  INNER JOIN lesson_students ls ON s.id = ls.student_id
  INNER JOIN lessons l ON ls.lesson_id = l.id
  INNER JOIN parents p ON s.parent_id = p.id
  WHERE (l.title ILIKE '%GCSE%' OR l.title ILIKE '%Year 11%')
    AND l.start_time >= '2025-11-24 00:00:00'::timestamp
    AND l.start_time < '2025-11-30 20:00:00'::timestamp
    AND s.status != 'trial'
    AND (l.lesson_type IS NULL OR l.lesson_type != 'trial')
    AND s.user_id IS NULL
    AND p.user_id IS NOT NULL
  GROUP BY p.user_id
)
UPDATE voice_session_quotas vsq
SET 
  bonus_minutes = bonus_minutes - stu.minutes_to_remove,
  minutes_remaining = minutes_remaining - stu.minutes_to_remove,
  total_minutes_allowed = total_minutes_allowed - stu.minutes_to_remove
FROM students_to_update stu
WHERE vsq.user_id = stu.target_user_id
  AND vsq.period_end > NOW();