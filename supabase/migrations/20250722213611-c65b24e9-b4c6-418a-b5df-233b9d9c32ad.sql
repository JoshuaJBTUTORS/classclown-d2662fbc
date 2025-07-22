
-- Add columns to lessons table for recurring lesson instance management
ALTER TABLE lessons 
ADD COLUMN parent_lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
ADD COLUMN instance_date date,
ADD COLUMN is_recurring_instance boolean DEFAULT false;

-- Update recurring_lesson_groups for better tracking
ALTER TABLE recurring_lesson_groups
ADD COLUMN instances_generated_until timestamp with time zone,
ADD COLUMN total_instances_generated integer DEFAULT 0,
ADD COLUMN is_infinite boolean DEFAULT false;

-- Add index for better performance when querying recurring instances
CREATE INDEX idx_lessons_parent_lesson_id ON lessons(parent_lesson_id);
CREATE INDEX idx_lessons_instance_date ON lessons(instance_date);
CREATE INDEX idx_lessons_is_recurring_instance ON lessons(is_recurring_instance);

-- Add index for recurring_lesson_groups queries
CREATE INDEX idx_recurring_lesson_groups_instances_until ON recurring_lesson_groups(instances_generated_until);
