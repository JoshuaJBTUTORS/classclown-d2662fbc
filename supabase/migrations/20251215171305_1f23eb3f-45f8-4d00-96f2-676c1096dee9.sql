-- Assign GCSE Combined Science Winter Term Exam to adityabrol2012@gmail.com
INSERT INTO assessment_assignments (assessment_id, assigned_to, assigned_by, status, due_date)
VALUES (
  '61fa134d-6a97-48ca-ad5b-27abca65c17f',  -- GCSE Combined Science Winter Term Exam
  'ebbefec5-f164-4bed-a413-29e9c4d693e8',  -- adityabrol2012@gmail.com
  '8c9c0bef-5d7a-47ce-8481-b750dbd2f2a4',  -- admin user
  'assigned',
  '2025-12-22'
)
ON CONFLICT DO NOTHING;