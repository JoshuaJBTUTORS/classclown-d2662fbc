
-- Delete lessons first (due to foreign key constraints)
DELETE FROM course_lessons 
WHERE module_id = 'c0ac2f62-f341-4cf3-bbaf-6e82d2db51f9';

-- Delete the module
DELETE FROM course_modules 
WHERE id = 'c0ac2f62-f341-4cf3-bbaf-6e82d2db51f9';
