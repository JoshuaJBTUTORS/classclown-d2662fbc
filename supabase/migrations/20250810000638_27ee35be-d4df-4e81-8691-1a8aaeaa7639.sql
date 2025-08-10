-- Drop the existing foreign key constraint
ALTER TABLE blog_generation_requests 
DROP CONSTRAINT IF EXISTS blog_generation_requests_generated_post_id_fkey;

-- Add the foreign key constraint with CASCADE DELETE
ALTER TABLE blog_generation_requests 
ADD CONSTRAINT blog_generation_requests_generated_post_id_fkey 
FOREIGN KEY (generated_post_id) 
REFERENCES blog_posts(id) 
ON DELETE CASCADE;