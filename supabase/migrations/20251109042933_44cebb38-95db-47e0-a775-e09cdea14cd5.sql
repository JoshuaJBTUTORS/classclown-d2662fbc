-- Step 1: Clean up duplicate GCSE courses
-- Keep only one instance of each GCSE course (the one with intermediate difficulty)
DELETE FROM courses 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY subject ORDER BY 
             CASE WHEN difficulty_level = 'intermediate' THEN 1 ELSE 2 END,
             created_at
           ) as rn
    FROM courses
    WHERE subject IN ('Biology', 'Chemistry', 'Physics')
      AND title LIKE '%GCSE%'
  ) t
  WHERE rn > 1
);

-- Step 2: Update existing GCSE courses to be free for all (without changing curriculum)
UPDATE courses
SET 
  is_free_for_all = true,
  status = 'published',
  difficulty_level = 'intermediate',
  updated_at = now()
WHERE subject IN ('Biology', 'Chemistry', 'Physics', 'English')
  AND title LIKE '%GCSE%';

-- Rename the English course to GCSE English Language
UPDATE courses
SET 
  title = 'GCSE English Language',
  description = 'Master English Language skills for GCSE with comprehensive modules covering reading, writing, and language analysis.',
  updated_at = now()
WHERE subject = 'English'
  AND title LIKE '%GCSE%';

-- Step 3: Create missing GCSE courses
INSERT INTO courses (title, description, subject, difficulty_level, status, is_free_for_all, price, generation_status)
VALUES 
  (
    'GCSE English Literature',
    'Explore classic and modern literature for GCSE, developing critical analysis and interpretation skills.',
    'English',
    'intermediate',
    'published',
    true,
    0,
    'shell'
  ),
  (
    'GCSE Computer Science',
    'Learn programming, algorithms, and computational thinking for GCSE Computer Science.',
    'Computer Science',
    'intermediate',
    'published',
    true,
    0,
    'shell'
  )
ON CONFLICT DO NOTHING;

-- Step 4: Create initial modules for all GCSE courses
-- Get the course IDs first and insert modules
WITH gcse_courses AS (
  SELECT id, title FROM courses 
  WHERE (title LIKE '%GCSE%' OR subject IN ('Biology', 'Chemistry', 'Physics', 'English', 'Computer Science'))
    AND difficulty_level = 'intermediate'
    AND is_free_for_all = true
)
INSERT INTO course_modules (course_id, title, description, position)
SELECT 
  id,
  'Getting Started',
  'Introduction to the course and foundational concepts',
  1
FROM gcse_courses
WHERE NOT EXISTS (
  SELECT 1 FROM course_modules 
  WHERE course_modules.course_id = gcse_courses.id 
    AND course_modules.title = 'Getting Started'
)
UNION ALL
SELECT 
  id,
  'Core Topics',
  'Essential topics and concepts for mastery',
  2
FROM gcse_courses
WHERE NOT EXISTS (
  SELECT 1 FROM course_modules 
  WHERE course_modules.course_id = gcse_courses.id 
    AND course_modules.title = 'Core Topics'
)
UNION ALL
SELECT 
  id,
  'Assessment & Review',
  'Practice assessments and comprehensive review',
  3
FROM gcse_courses
WHERE NOT EXISTS (
  SELECT 1 FROM course_modules 
  WHERE course_modules.course_id = gcse_courses.id 
    AND course_modules.title = 'Assessment & Review'
);