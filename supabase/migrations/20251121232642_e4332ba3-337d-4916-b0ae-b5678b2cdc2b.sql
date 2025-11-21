-- Delete 11 Plus courses, A-Level Physics, and Year 1 Maths
-- This will cascade to related course_modules, course_lessons, etc.

DELETE FROM courses 
WHERE id IN (
  '1b1c02fe-fbe1-4962-9e67-3c7e26b8ba1c', -- 11 Plus English
  'b8bafac0-d6b8-4c79-9d16-a0e9ed1e7e18', -- 11 Plus Maths
  '53f58681-0c28-40f8-b464-cb1e5d326f85', -- 11 Plus NVR
  '7b76c6cf-0e76-4c41-ba2e-b2c6ff5ef9a7', -- 11 Plus Verbal Reasoning
  '490720a3-09b9-4dba-9cad-08d15380e5a9'  -- A-Level Physics
)
OR title = 'year_1 Maths';