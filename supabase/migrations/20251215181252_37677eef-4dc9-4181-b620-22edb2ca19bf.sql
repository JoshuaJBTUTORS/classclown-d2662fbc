
-- Assign GCSE Maths Paper 1 Winter Exam to alinciopec@yahoo.com
INSERT INTO assessment_assignments (assessment_id, assigned_to, assigned_by, status, due_date, notes)
VALUES (
  '0dd7de16-d0d8-422d-adbe-4945fab2af2f',
  '1a12922b-4804-4c1d-849e-f830490ad0b3',
  '1a12922b-4804-4c1d-849e-f830490ad0b3',
  'assigned',
  '2025-12-22 23:59:59+00',
  'Manually assigned: GCSE Maths Paper 1 Winter Exam'
)
ON CONFLICT DO NOTHING;
