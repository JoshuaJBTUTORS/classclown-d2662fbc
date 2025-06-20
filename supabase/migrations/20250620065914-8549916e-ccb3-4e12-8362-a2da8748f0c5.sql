
-- Update the GCSE Biology course with the correct Stripe Price ID
UPDATE courses 
SET stripe_price_id = 'price_1RbyhfJvbqr5stJMYQyJmHSU'
WHERE title = 'GCSE Biology' AND stripe_price_id IS NULL;
