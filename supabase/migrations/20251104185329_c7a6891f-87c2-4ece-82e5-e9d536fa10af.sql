-- Step 1: Delete duplicate lesson plans, keeping only the most recent for each topic/year_group
-- For standalone plans (lesson_id IS NULL)
DELETE FROM cleo_lesson_plans
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY topic, year_group ORDER BY created_at DESC) as rn
    FROM cleo_lesson_plans
    WHERE lesson_id IS NULL
  ) t
  WHERE rn > 1
);

-- For lesson-based plans (lesson_id IS NOT NULL)
DELETE FROM cleo_lesson_plans
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY lesson_id ORDER BY created_at DESC) as rn
    FROM cleo_lesson_plans
    WHERE lesson_id IS NOT NULL
  ) t
  WHERE rn > 1
);

-- Step 2: Add unique constraints to prevent future duplicates

-- Constraint 1: Only one plan per lesson_id (when lesson_id is not NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_lesson_plan 
  ON cleo_lesson_plans(lesson_id) 
  WHERE lesson_id IS NOT NULL;

-- Constraint 2: Only one plan per (topic, year_group) for standalone plans (when lesson_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_standalone_plan 
  ON cleo_lesson_plans(topic, year_group) 
  WHERE lesson_id IS NULL;

-- Step 3: Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_lesson_plans_status 
  ON cleo_lesson_plans(status);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_topic_year 
  ON cleo_lesson_plans(topic, year_group);