-- Delete assessment questions first (foreign key constraint)
DELETE FROM assessment_questions WHERE assessment_id IN (
  'eb62e2d0-03be-40f0-a828-26657d18bd89',
  'e012aa48-8492-4438-9b19-3879c5458b15'
);

-- Delete the assessments
DELETE FROM ai_assessments WHERE id IN (
  'eb62e2d0-03be-40f0-a828-26657d18bd89',
  'e012aa48-8492-4438-9b19-3879c5458b15'
);