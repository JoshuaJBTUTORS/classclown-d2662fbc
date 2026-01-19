-- Sync all existing marked responses to their session totals
UPDATE assessment_sessions ass
SET 
  total_marks_achieved = subq.sum_achieved,
  total_marks_available = subq.sum_available,
  updated_at = NOW()
FROM (
  SELECT 
    sr.session_id,
    COALESCE(SUM(sr.marks_awarded), 0)::integer as sum_achieved,
    COALESCE(SUM(aq.marks_available), 0)::integer as sum_available
  FROM student_responses sr
  JOIN assessment_questions aq ON sr.question_id = aq.id
  WHERE sr.marks_awarded IS NOT NULL
  GROUP BY sr.session_id
) subq
WHERE ass.id = subq.session_id;