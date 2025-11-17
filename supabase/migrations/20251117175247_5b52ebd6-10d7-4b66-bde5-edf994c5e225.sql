-- Update GCSE English lesson plans to use consistent term format (remove "Term" suffix)
UPDATE lesson_plans 
SET term = CASE 
  WHEN term = 'Autumn Term' THEN 'Autumn'
  WHEN term = 'Spring Term' THEN 'Spring'
  WHEN term = 'Summer Term' THEN 'Summer'
  ELSE term
END
WHERE subject = 'GCSE English'
AND term IN ('Autumn Term', 'Spring Term', 'Summer Term');