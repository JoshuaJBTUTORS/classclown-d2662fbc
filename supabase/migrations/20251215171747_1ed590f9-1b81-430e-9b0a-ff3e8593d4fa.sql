-- Assign parent exams to students who have their own accounts
INSERT INTO assessment_assignments (assessment_id, assigned_to, assigned_by, status, due_date, notes)
SELECT DISTINCT
  aa.assessment_id,
  s.user_id as assigned_to,
  aa.assigned_by,
  'assigned',
  aa.due_date,
  'Auto-assigned: copied from parent assignment'
FROM students s
JOIN parents p ON p.id = s.parent_id
JOIN assessment_assignments aa ON aa.assigned_to = p.user_id
WHERE s.user_id IS NOT NULL 
  AND s.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM assessment_assignments aa2 
    WHERE aa2.assigned_to = s.user_id 
    AND aa2.assessment_id = aa.assessment_id
  )
ON CONFLICT DO NOTHING;