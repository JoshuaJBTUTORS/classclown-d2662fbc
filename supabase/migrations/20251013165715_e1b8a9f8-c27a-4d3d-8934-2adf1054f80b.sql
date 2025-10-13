-- Make content-videos bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'content-videos';