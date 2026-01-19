-- Reset failed AI marking responses for re-processing
-- These responses have error feedback and need to be re-marked with improved reliability

UPDATE student_responses
SET 
  marked_at = NULL,
  marks_awarded = NULL,
  ai_feedback = NULL,
  marking_breakdown = NULL,
  confidence_score = NULL,
  marked_by = NULL
WHERE ai_feedback = 'Error during AI marking. Manual review required.'
  AND confidence_score = 0;