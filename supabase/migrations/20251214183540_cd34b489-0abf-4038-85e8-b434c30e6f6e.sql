-- Step 1: Create missing Winter Term Exam assessments
INSERT INTO ai_assessments (id, title, subject, status, exam_board, total_marks, time_limit_minutes, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Early KS2 - Winter Term Exam', 'Early KS2', 'published', 'National Curriculum', 50, 45, NOW(), NOW()),
  (gen_random_uuid(), '11 PLUS NVR - Winter Term Exam', '11 Plus NVR', 'published', '11 Plus', 80, 50, NOW(), NOW()),
  (gen_random_uuid(), 'GCSE Chemistry Paper 1 - Winter Term Exam', 'GCSE Chemistry', 'published', 'AQA', 100, 90, NOW(), NOW());

-- Step 2: Auto-assign Winter Term Exams to students based on lessons from Dec 15-22
WITH lesson_students_data AS (
  SELECT DISTINCT 
    ls.student_id,
    p.user_id as parent_user_id,
    l.subject
  FROM lessons l
  JOIN lesson_students ls ON l.id = ls.lesson_id
  JOIN students s ON ls.student_id = s.id
  JOIN parents p ON s.parent_id = p.id
  WHERE l.start_time >= '2024-12-15'::timestamp
    AND l.start_time < '2024-12-23'::timestamp
    AND p.user_id IS NOT NULL
    -- Exclude A-level, Business, Economics
    AND l.subject NOT ILIKE '%a-level%'
    AND l.subject NOT ILIKE '%a level%'
    AND l.subject NOT ILIKE '%alevel%'
    AND l.subject NOT ILIKE '%business%'
    AND l.subject NOT ILIKE '%economics%'
),
subject_to_assessment AS (
  SELECT * FROM (VALUES
    -- GCSE/Year 11 Maths
    ('GCSE Maths Higher', '0dd7de16-d0d8-422d-adbe-4945fab2af2f'::uuid),
    ('GCSE Maths Foundation', '0dd7de16-d0d8-422d-adbe-4945fab2af2f'::uuid),
    ('Year 11 Maths Higher', '0dd7de16-d0d8-422d-adbe-4945fab2af2f'::uuid),
    ('Year 11 Maths Foundation', '0dd7de16-d0d8-422d-adbe-4945fab2af2f'::uuid),
    ('GCSE Maths', '0dd7de16-d0d8-422d-adbe-4945fab2af2f'::uuid),
    ('Year 11 Maths', '0dd7de16-d0d8-422d-adbe-4945fab2af2f'::uuid),
    -- GCSE/Year 11 English
    ('GCSE English', '676d29d8-fc26-4ab2-a2e4-d9516686057f'::uuid),
    ('Year 11 English', '676d29d8-fc26-4ab2-a2e4-d9516686057f'::uuid),
    ('GCSE English Language', '676d29d8-fc26-4ab2-a2e4-d9516686057f'::uuid),
    -- GCSE/Year 11 Combined Science
    ('GCSE Combined Science', '61fa134d-6a97-48ca-ad5b-27abca65c17f'::uuid),
    ('Year 11 Combined Science', '61fa134d-6a97-48ca-ad5b-27abca65c17f'::uuid),
    ('GCSE Science', '61fa134d-6a97-48ca-ad5b-27abca65c17f'::uuid),
    ('Year 11 Science', '61fa134d-6a97-48ca-ad5b-27abca65c17f'::uuid),
    -- GCSE Biology
    ('GCSE Biology', '67e347c6-855f-433c-be21-1e96b72369ab'::uuid),
    -- GCSE Physics
    ('GCSE Physics', '5764c4cc-14a5-4b4a-93eb-c1ab48888ea8'::uuid),
    -- GCSE Computer Science
    ('GCSE Computer Science', 'f8e31163-e2b2-4149-8016-03aa141fbcd4'::uuid),
    -- KS3
    ('KS3 Maths', '1e7e71ca-da12-4650-ad80-b3691f00dafa'::uuid),
    ('KS3 English', '03cc99ad-49cf-41db-9633-742a43824ddd'::uuid),
    ('KS3 Science', '33895781-6700-418e-b42f-edb6d0b62331'::uuid),
    -- KS2/Sats
    ('KS2 Maths', '3abe1249-f8b3-4882-9100-edf50710d9c5'::uuid),
    ('KS2 English', 'ddde5df5-440e-469c-b0ce-8eaf716c004d'::uuid),
    ('Sats Maths', '3abe1249-f8b3-4882-9100-edf50710d9c5'::uuid),
    ('Sats English', 'ddde5df5-440e-469c-b0ce-8eaf716c004d'::uuid),
    -- 11 Plus
    ('11 Plus English', 'ba094c52-3882-4b83-bd13-492b64e3b1d8'::uuid),
    ('11 Plus Maths', 'a475f040-a67b-40b7-b422-5f5ca46fab63'::uuid),
    ('11 Plus VR', 'b3fd14c5-e00f-489b-8971-2cc4933f6f76'::uuid)
  ) AS t(subject_name, assessment_id)
),
-- Get the newly created assessment IDs for Early KS2, 11 Plus NVR, GCSE Chemistry
new_assessments AS (
  SELECT id, subject FROM ai_assessments 
  WHERE title IN ('Early KS2 - Winter Term Exam', '11 PLUS NVR - Winter Term Exam', 'GCSE Chemistry Paper 1 - Winter Term Exam')
),
-- Add new assessment mappings
extended_mapping AS (
  SELECT * FROM subject_to_assessment
  UNION ALL
  SELECT 'Early KS2', id FROM new_assessments WHERE subject = 'Early KS2'
  UNION ALL
  SELECT '11 Plus NVR', id FROM new_assessments WHERE subject = '11 Plus NVR'
  UNION ALL
  SELECT 'GCSE Chemistry', id FROM new_assessments WHERE subject = 'GCSE Chemistry'
),
assignments_to_create AS (
  SELECT DISTINCT
    em.assessment_id,
    lsd.parent_user_id as assigned_to,
    '9a6cb4b5-4e6e-4b47-815c-677987600aa9'::uuid as assigned_by,
    '2024-12-22 23:59:59'::timestamp with time zone as due_date
  FROM lesson_students_data lsd
  JOIN extended_mapping em ON LOWER(lsd.subject) = LOWER(em.subject_name)
  WHERE em.assessment_id IS NOT NULL
)
INSERT INTO assessment_assignments (assessment_id, assigned_to, assigned_by, due_date, status, created_at, updated_at)
SELECT 
  assessment_id,
  assigned_to,
  assigned_by,
  due_date,
  'assigned',
  NOW(),
  NOW()
FROM assignments_to_create
ON CONFLICT DO NOTHING;