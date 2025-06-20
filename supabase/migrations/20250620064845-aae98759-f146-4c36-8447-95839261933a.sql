
-- Add stripe_price_id column to courses table
ALTER TABLE courses ADD COLUMN stripe_price_id TEXT;

-- Update the GCSE Biology course with the new price and Stripe Price ID
UPDATE courses 
SET 
  price = 1299,  -- £12.99 in pence
  stripe_price_id = 'price_1RbyhfJvbqr5stJMYQyJmHSU'
WHERE title = 'GCSE Biology';

-- If there are other courses that need the default price updated
UPDATE courses 
SET price = 1299 
WHERE price = 899;
