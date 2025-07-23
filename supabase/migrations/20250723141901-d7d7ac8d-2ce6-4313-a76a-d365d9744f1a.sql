-- Update the recurring lesson group to make it eligible for generating new instances
UPDATE recurring_lesson_groups 
SET 
  instances_generated_until = CURRENT_DATE,
  next_extension_date = CURRENT_DATE + INTERVAL '2 days',
  updated_at = NOW()
WHERE id = '1f56255d-976a-4a52-b3f8-c1eedf5e8b70';