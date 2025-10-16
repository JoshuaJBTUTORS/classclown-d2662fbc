-- Add Stripe Price IDs to 11 Plus English and Maths courses

-- Update 11 Plus English course with Stripe Price ID
UPDATE courses 
SET stripe_price_id = 'price_1SItfIJvbqr5stJMlnVhK3w8'
WHERE title ILIKE '%11 plus%' AND subject ILIKE '%english%';

-- Update 11 Plus Maths course with Stripe Price ID  
UPDATE courses 
SET stripe_price_id = 'price_1SIterJvbqr5stJMjFcICE1L'
WHERE title ILIKE '%11 plus%' AND subject ILIKE '%maths%';

-- Add comment for documentation
COMMENT ON COLUMN courses.stripe_price_id IS 'Stripe Price ID for subscription billing. Format: price_*';