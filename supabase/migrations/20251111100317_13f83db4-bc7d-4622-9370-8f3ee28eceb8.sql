-- Set all published courses to require subscription access
UPDATE courses 
SET is_free_for_all = false 
WHERE status = 'published';