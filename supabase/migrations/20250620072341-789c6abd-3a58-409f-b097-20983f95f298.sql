
-- Remove existing course purchase for learninghub@gmail.com to enable testing
-- This will allow testing the complete trial signup workflow
DELETE FROM course_purchases 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'learninghub@gmail.com'
);
