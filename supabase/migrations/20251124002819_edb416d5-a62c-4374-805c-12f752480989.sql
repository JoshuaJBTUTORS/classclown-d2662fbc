-- Create GCSE Combined Science course
WITH new_course AS (
  INSERT INTO courses (id, title, subject, difficulty_level, status, description, is_free_for_all)
  VALUES (
    gen_random_uuid(),
    'GCSE Combined Science',
    'Combined Science',
    'gcse',
    'published',
    'Interleaved Physics, Chemistry, and Biology curriculum following the 52-week lesson plan',
    false
  )
  RETURNING id
),
source_modules AS (
  SELECT 
    cm.id,
    cm.title,
    cm.description,
    c.subject,
    ROW_NUMBER() OVER (PARTITION BY c.subject ORDER BY cm.position) as module_num
  FROM course_modules cm
  JOIN courses c ON c.id = cm.course_id
  WHERE c.subject IN ('Physics', 'Chemistry', 'Biology')
    AND c.difficulty_level = 'gcse'
    AND c.status = 'published'
),
interleaved_modules AS (
  SELECT 
    id,
    title,
    description,
    subject,
    module_num,
    ROW_NUMBER() OVER (ORDER BY 
      CASE subject 
        WHEN 'Physics' THEN 1 
        WHEN 'Chemistry' THEN 2 
        WHEN 'Biology' THEN 3 
      END,
      module_num
    ) as week_position
  FROM source_modules
),
all_52_weeks AS (
  -- First cycle: weeks 1-26
  SELECT 
    gen_random_uuid() as id,
    (SELECT id FROM new_course) as course_id,
    title,
    description,
    (week_position - 1) as position,
    subject
  FROM interleaved_modules
  WHERE week_position <= 26
  
  UNION ALL
  
  -- Second cycle: weeks 27-52 with "- deeper understanding"
  SELECT 
    gen_random_uuid() as id,
    (SELECT id FROM new_course) as course_id,
    title || ' - deeper understanding' as title,
    description,
    (week_position + 25) as position,
    subject
  FROM interleaved_modules
  WHERE week_position <= 26
)
INSERT INTO course_modules (id, course_id, title, description, position)
SELECT id, course_id, title, description, position
FROM all_52_weeks
ORDER BY position;