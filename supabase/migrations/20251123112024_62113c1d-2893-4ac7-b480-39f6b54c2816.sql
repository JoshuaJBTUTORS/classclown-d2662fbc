-- Delete existing GCSE Science lesson plans
DELETE FROM lesson_plans 
WHERE subject IN ('GCSE Biology', 'GCSE Chemistry', 'GCSE Physics');

-- Insert GCSE Biology (83 lessons → 52 weeks, ~1.6 lessons/week)
WITH numbered_lessons AS (
  SELECT 
    cl.id,
    cl.title,
    cl.description,
    ROW_NUMBER() OVER (ORDER BY cm.position, cl.position) as lesson_num
  FROM course_lessons cl
  JOIN course_modules cm ON cl.module_id = cm.id
  WHERE cm.course_id = 'dcd2885d-f43a-4c9e-8f08-046e57d12e26'
),
grouped_lessons AS (
  SELECT 
    CEIL(lesson_num / 1.6)::integer as week_number,
    STRING_AGG(title, ', ' ORDER BY lesson_num) as topic_title,
    STRING_AGG(COALESCE(description, ''), '. ' ORDER BY lesson_num) as description
  FROM numbered_lessons
  GROUP BY CEIL(lesson_num / 1.6)
)
INSERT INTO lesson_plans (subject, term, week_number, topic_title, description)
SELECT 
  'GCSE Biology',
  CASE 
    WHEN week_number BETWEEN 1 AND 17 THEN 'Autumn'
    WHEN week_number BETWEEN 18 AND 35 THEN 'Spring'
    ELSE 'Summer'
  END as term,
  week_number,
  topic_title,
  description
FROM grouped_lessons
WHERE week_number <= 52
ORDER BY week_number;

-- Insert GCSE Chemistry (83 lessons → 52 weeks, ~1.6 lessons/week)
WITH numbered_lessons AS (
  SELECT 
    cl.id,
    cl.title,
    cl.description,
    ROW_NUMBER() OVER (ORDER BY cm.position, cl.position) as lesson_num
  FROM course_lessons cl
  JOIN course_modules cm ON cl.module_id = cm.id
  WHERE cm.course_id = '34326bd0-4c00-4520-8988-3a067f17c0d2'
),
grouped_lessons AS (
  SELECT 
    CEIL(lesson_num / 1.6)::integer as week_number,
    STRING_AGG(title, ', ' ORDER BY lesson_num) as topic_title,
    STRING_AGG(COALESCE(description, ''), '. ' ORDER BY lesson_num) as description
  FROM numbered_lessons
  GROUP BY CEIL(lesson_num / 1.6)
)
INSERT INTO lesson_plans (subject, term, week_number, topic_title, description)
SELECT 
  'GCSE Chemistry',
  CASE 
    WHEN week_number BETWEEN 1 AND 17 THEN 'Autumn'
    WHEN week_number BETWEEN 18 AND 35 THEN 'Spring'
    ELSE 'Summer'
  END as term,
  week_number,
  topic_title,
  description
FROM grouped_lessons
WHERE week_number <= 52
ORDER BY week_number;

-- Insert GCSE Physics (103 lessons → 52 weeks, ~2.0 lessons/week)
WITH numbered_lessons AS (
  SELECT 
    cl.id,
    cl.title,
    cl.description,
    ROW_NUMBER() OVER (ORDER BY cm.position, cl.position) as lesson_num
  FROM course_lessons cl
  JOIN course_modules cm ON cl.module_id = cm.id
  WHERE cm.course_id = 'ecad6722-809f-4988-a2c0-40966d20f516'
),
grouped_lessons AS (
  SELECT 
    CEIL(lesson_num / 2.0)::integer as week_number,
    STRING_AGG(title, ', ' ORDER BY lesson_num) as topic_title,
    STRING_AGG(COALESCE(description, ''), '. ' ORDER BY lesson_num) as description
  FROM numbered_lessons
  GROUP BY CEIL(lesson_num / 2.0)
)
INSERT INTO lesson_plans (subject, term, week_number, topic_title, description)
SELECT 
  'GCSE Physics',
  CASE 
    WHEN week_number BETWEEN 1 AND 17 THEN 'Autumn'
    WHEN week_number BETWEEN 18 AND 35 THEN 'Spring'
    ELSE 'Summer'
  END as term,
  week_number,
  topic_title,
  description
FROM grouped_lessons
WHERE week_number <= 52
ORDER BY week_number;