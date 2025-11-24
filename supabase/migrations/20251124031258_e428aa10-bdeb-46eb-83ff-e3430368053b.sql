-- Add bonus Cleo minutes for GCSE/Year 11 lessons (24/11/2025 - 30/11/2025 8pm)
-- Corrected version: Aggregates per student first to prevent double-counting

WITH lesson_counts_per_student AS (
  -- First, count lessons per student (in the target date range)
  SELECT 
    s.id as student_id,
    s.user_id as student_user_id,
    s.parent_id,
    COUNT(DISTINCT l.id) as lesson_count
  FROM students s
  INNER JOIN lesson_students ls ON s.id = ls.student_id
  INNER JOIN lessons l ON ls.lesson_id = l.id
  WHERE (l.title ILIKE '%GCSE%' OR l.title ILIKE '%Year 11%')
    AND l.start_time >= '2025-11-24 00:00:00'::timestamp
    AND l.start_time < '2025-11-30 20:00:00'::timestamp
    AND s.status != 'trial'
    AND (l.lesson_type IS NULL OR l.lesson_type != 'trial')
  GROUP BY s.id, s.user_id, s.parent_id
),
accounts_to_credit AS (
  -- Now determine which accounts to credit
  -- Student accounts (if they exist)
  SELECT 
    lc.student_user_id as target_user_id,
    SUM(lc.lesson_count * 10) as minutes_to_add
  FROM lesson_counts_per_student lc
  WHERE lc.student_user_id IS NOT NULL
  GROUP BY lc.student_user_id

  UNION ALL

  -- Parent accounts (always - but aggregated correctly)
  SELECT 
    p.user_id as target_user_id,
    SUM(lc.lesson_count * 10) as minutes_to_add
  FROM lesson_counts_per_student lc
  INNER JOIN parents p ON lc.parent_id = p.id
  WHERE p.user_id IS NOT NULL
  GROUP BY p.user_id
)
UPDATE voice_session_quotas vsq
SET 
  bonus_minutes = bonus_minutes + atc.minutes_to_add,
  minutes_remaining = minutes_remaining + atc.minutes_to_add,
  total_minutes_allowed = total_minutes_allowed + atc.minutes_to_add
FROM accounts_to_credit atc
WHERE vsq.user_id = atc.target_user_id
  AND vsq.period_end > NOW();