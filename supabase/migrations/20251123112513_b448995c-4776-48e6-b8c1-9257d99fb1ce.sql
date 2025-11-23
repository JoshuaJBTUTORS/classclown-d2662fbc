-- Delete existing GCSE Maths lesson plans
DELETE FROM lesson_plans 
WHERE subject = 'GCSE Maths';

-- Insert GCSE Maths (89 lessons → 52 weeks, ~1.7 lessons/week)
WITH numbered_lessons AS (
  SELECT 
    cl.id,
    cl.title,
    cl.description,
    ROW_NUMBER() OVER (ORDER BY cm.position, cl.position) as lesson_num
  FROM course_lessons cl
  JOIN course_modules cm ON cl.module_id = cm.id
  WHERE cm.course_id = '74e17c21-14a2-4194-8f9e-d5eba2612922'
),
grouped_lessons AS (
  SELECT 
    CEIL(lesson_num / 1.7)::integer as week_number,
    STRING_AGG(title, ', ' ORDER BY lesson_num) as topic_title,
    STRING_AGG(COALESCE(description, ''), '. ' ORDER BY lesson_num) as description
  FROM numbered_lessons
  GROUP BY CEIL(lesson_num / 1.7)
)
INSERT INTO lesson_plans (subject, term, week_number, topic_title, description)
SELECT 
  'GCSE Maths',
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