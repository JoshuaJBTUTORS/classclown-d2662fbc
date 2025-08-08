-- Drop demo-related tables
DROP TABLE IF EXISTS demo_sessions CASCADE;
DROP TABLE IF EXISTS demo_configurations CASCADE;
DROP TABLE IF EXISTS demo_users CASCADE;

-- Clean up demo data from existing tables
DELETE FROM lessons WHERE is_demo_data = true;
DELETE FROM homework WHERE is_demo_data = true;
DELETE FROM students WHERE is_demo_data = true;
DELETE FROM parents WHERE is_demo_data = true;
DELETE FROM tutors WHERE is_demo_data = true;
DELETE FROM courses WHERE is_demo_data = true;

-- Remove demo data columns from tables
ALTER TABLE lessons DROP COLUMN IF EXISTS is_demo_data;
ALTER TABLE homework DROP COLUMN IF EXISTS is_demo_data;
ALTER TABLE students DROP COLUMN IF EXISTS is_demo_data;
ALTER TABLE parents DROP COLUMN IF EXISTS is_demo_data;
ALTER TABLE tutors DROP COLUMN IF EXISTS is_demo_data;
ALTER TABLE courses DROP COLUMN IF EXISTS is_demo_data;