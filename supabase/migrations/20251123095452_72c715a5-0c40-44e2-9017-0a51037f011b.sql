-- Corrected: Grant Cleo Hub access to GCSE/Year 11 students and parents
-- This fixes the previous migration by correctly using user_id instead of parent_id

-- Grant access to students who have their own accounts
UPDATE profiles
SET has_cleo_hub_access = true
WHERE id IN (
  SELECT DISTINCT s.user_id
  FROM students s
  INNER JOIN lesson_students ls ON s.id = ls.student_id
  INNER JOIN lessons l ON ls.lesson_id = l.id
  WHERE (l.title ILIKE '%GCSE%' OR l.title ILIKE '%Year 11%')
    AND l.start_time >= date_trunc('week', CURRENT_DATE)
    AND l.start_time < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'
    AND s.status != 'trial'
    AND (l.lesson_type IS NULL OR l.lesson_type != 'trial')
    AND s.user_id IS NOT NULL
);

-- Grant access to parents of these students
UPDATE profiles
SET has_cleo_hub_access = true
WHERE id IN (
  SELECT DISTINCT p.user_id
  FROM students s
  INNER JOIN lesson_students ls ON s.id = ls.student_id
  INNER JOIN lessons l ON ls.lesson_id = l.id
  INNER JOIN parents p ON s.parent_id = p.id
  WHERE (l.title ILIKE '%GCSE%' OR l.title ILIKE '%Year 11%')
    AND l.start_time >= date_trunc('week', CURRENT_DATE)
    AND l.start_time < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'
    AND s.status != 'trial'
    AND (l.lesson_type IS NULL OR l.lesson_type != 'trial')
    AND p.user_id IS NOT NULL
);