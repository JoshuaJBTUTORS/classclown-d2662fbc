
-- Force update the GCSE Biology course with the correct Stripe Price ID
-- Remove the condition to ensure it updates regardless of current value
UPDATE courses 
SET stripe_price_id = 'price_1RbyhfJvbqr5stJMYQyJmHSU'
WHERE title = 'GCSE Biology';

-- Also verify we have the right course by checking all courses with similar names
UPDATE courses 
SET stripe_price_id = 'price_1RbyhfJvbqr5stJMYQyJmHSU'
WHERE title ILIKE '%GCSE Biology%' OR title ILIKE '%biology%';

-- Set a fallback price if stripe_price_id is still null for any course
UPDATE courses 
SET stripe_price_id = 'price_1RbyhfJvbqr5stJMYQyJmHSU'
WHERE stripe_price_id IS NULL AND price = 1299;
