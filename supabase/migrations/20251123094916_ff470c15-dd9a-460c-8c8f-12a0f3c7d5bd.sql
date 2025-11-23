-- Grant Cleo Hub access to parents of students with GCSE/Year 11 lessons this week (excluding trial students)
UPDATE profiles
SET has_cleo_hub_access = true
WHERE id IN (
  SELECT DISTINCT s.parent_id
  FROM students s
  INNER JOIN lesson_students ls ON ls.student_id = s.id
  INNER JOIN lessons l ON l.id = ls.lesson_id
  WHERE s.parent_id IS NOT NULL
    AND s.status != 'trial'
    AND (l.lesson_type IS NULL OR l.lesson_type != 'trial')
    AND (l.title ILIKE '%GCSE%' OR l.title ILIKE '%Year 11%')
    AND l.start_time >= date_trunc('week', CURRENT_DATE)
    AND l.start_time < date_trunc('week', CURRENT_DATE) + interval '1 week'
);

-- Grant Cleo Hub access to students who have their own accounts AND have GCSE/Year 11 lessons this week (excluding trial students)
UPDATE profiles
SET has_cleo_hub_access = true
WHERE id IN (
  SELECT DISTINCT s.user_id
  FROM students s
  INNER JOIN lesson_students ls ON ls.student_id = s.id
  INNER JOIN lessons l ON l.id = ls.lesson_id
  WHERE s.user_id IS NOT NULL
    AND s.status != 'trial'
    AND (l.lesson_type IS NULL OR l.lesson_type != 'trial')
    AND (l.title ILIKE '%GCSE%' OR l.title ILIKE '%Year 11%')
    AND l.start_time >= date_trunc('week', CURRENT_DATE)
    AND l.start_time < date_trunc('week', CURRENT_DATE) + interval '1 week'
);