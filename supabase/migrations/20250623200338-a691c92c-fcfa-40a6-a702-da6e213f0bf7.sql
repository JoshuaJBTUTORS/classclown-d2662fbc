
-- Update the homework-submissions bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'homework-submissions';
