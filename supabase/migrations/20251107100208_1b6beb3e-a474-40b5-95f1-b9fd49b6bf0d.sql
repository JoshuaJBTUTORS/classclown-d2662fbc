-- Add is_free_for_all column to courses table
ALTER TABLE courses 
ADD COLUMN is_free_for_all BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN courses.is_free_for_all IS 'Marks courses as freely accessible to all users without purchase requirement';