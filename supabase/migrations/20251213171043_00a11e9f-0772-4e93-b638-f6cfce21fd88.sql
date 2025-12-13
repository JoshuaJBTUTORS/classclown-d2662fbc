-- Delete assessment questions first (foreign key constraint)
DELETE FROM assessment_questions WHERE assessment_id IN (
  '76c7e306-289c-432d-8694-cdf5f56a2171',
  'bd919945-8a4c-4e69-91bc-c3ef08b26443'
);

-- Delete the assessments
DELETE FROM ai_assessments WHERE id IN (
  '76c7e306-289c-432d-8694-cdf5f56a2171',
  'bd919945-8a4c-4e69-91bc-c3ef08b26443'
);