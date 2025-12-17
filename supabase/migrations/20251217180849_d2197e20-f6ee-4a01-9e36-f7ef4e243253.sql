
-- Update all assignments from wrong GCSE Chemistry Paper 1 (100 marks) to correct GCSE Chemistry (106 marks)
UPDATE assessment_assignments 
SET assessment_id = 'd760cb35-ee66-426e-860d-a6b9b352a3df'
WHERE assessment_id = 'fc545c8a-2fa5-42db-9be1-c9245ad1e056';

-- Publish the correct assessment so students can take it
UPDATE ai_assessments 
SET status = 'published'
WHERE id = 'd760cb35-ee66-426e-860d-a6b9b352a3df';
