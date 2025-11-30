# HeyCleo Data Import Guide

This guide explains how to import exported HeyCleo data into a new Supabase project.

## Prerequisites

1. New Supabase project created
2. `schema.sql` executed in new project (creates all tables)
3. `functions.sql` executed (creates database functions)
4. Edge functions deployed
5. Exported JSON file from `export-heycleo-data` edge function

## Import Order (CRITICAL)

Tables must be imported in dependency order to avoid foreign key violations:

### Phase 1: Foundation Tables (No Dependencies)
```sql
-- These can be imported first
1. subjects
2. year_groups
3. app_settings
4. platform_subscription_plans
```

### Phase 2: User Tables
```sql
-- Profiles first, then roles
5. profiles
6. user_roles
```

### Phase 3: Curriculum & Exam Boards
```sql
7. curriculum_year_groups
8. exam_board_specifications
```

### Phase 4: Course Structure
```sql
9. courses
10. course_exam_board_specifications
11. course_modules
12. course_lessons
```

### Phase 5: User-Course Data
```sql
13. course_purchases
14. course_notes
```

### Phase 6: Cleo Data
```sql
15. cleo_conversations
16. cleo_messages
17. cleo_learning_progress
18. cleo_lesson_plans
19. cleo_lesson_state
20. cleo_question_answers
```

### Phase 7: Gamification
```sql
21. user_gamification_stats
22. user_badges
```

### Phase 8: Voice & Subscriptions
```sql
23. voice_session_quotas
24. platform_subscriptions
```

### Phase 9: Assessments
```sql
25. ai_assessments
26. assessment_questions
27. assessment_sessions
28. student_responses
29. assessment_improvements
```

## Import Methods

### Method 1: Supabase Dashboard (Recommended for Small Data)

1. Go to **Table Editor** in Supabase Dashboard
2. Select the table to import
3. Click **Insert** → **Import data from CSV**
4. Convert JSON to CSV first, or use the SQL method below

### Method 2: SQL INSERT Statements

For each table in the JSON export, generate INSERT statements:

```sql
-- Example for 'subjects' table
INSERT INTO subjects (id, name, description, created_at, updated_at)
VALUES 
  ('uuid-1', 'Mathematics', 'GCSE Maths', '2024-01-01', '2024-01-01'),
  ('uuid-2', 'English', 'GCSE English', '2024-01-01', '2024-01-01');
```

### Method 3: Node.js Import Script

```javascript
// import-data.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'YOUR_NEW_PROJECT_URL',
  'YOUR_SERVICE_ROLE_KEY'
);

const exportData = JSON.parse(fs.readFileSync('heycleo-export.json', 'utf8'));

const importOrder = [
  'subjects',
  'year_groups',
  'app_settings',
  'platform_subscription_plans',
  'profiles',
  'user_roles',
  'curriculum_year_groups',
  'exam_board_specifications',
  'courses',
  'course_exam_board_specifications',
  'course_modules',
  'course_lessons',
  'course_purchases',
  'course_notes',
  'cleo_conversations',
  'cleo_messages',
  'cleo_learning_progress',
  'cleo_lesson_plans',
  'cleo_lesson_state',
  'cleo_question_answers',
  'user_gamification_stats',
  'user_badges',
  'voice_session_quotas',
  'platform_subscriptions',
  'ai_assessments',
  'assessment_questions',
  'assessment_sessions',
  'student_responses',
  'assessment_improvements',
];

async function importTable(tableName) {
  const data = exportData.tables[tableName];
  if (!data || data.length === 0) {
    console.log(`Skipping ${tableName} (no data)`);
    return;
  }

  // Disable RLS temporarily for import
  // (requires service_role key)
  
  // Batch insert in chunks of 100
  const chunkSize = 100;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const { error } = await supabase.from(tableName).insert(chunk);
    if (error) {
      console.error(`Error importing ${tableName}:`, error.message);
    }
  }
  
  console.log(`Imported ${data.length} rows into ${tableName}`);
}

async function main() {
  for (const table of importOrder) {
    await importTable(table);
  }
  console.log('Import complete!');
}

main();
```

## Post-Import Steps

### 1. Verify Foreign Keys
```sql
-- Check for orphaned records
SELECT * FROM course_modules WHERE course_id NOT IN (SELECT id FROM courses);
SELECT * FROM cleo_messages WHERE conversation_id NOT IN (SELECT id FROM cleo_conversations);
```

### 2. Reset Sequences (if using serial IDs)
```sql
-- Only needed if any tables use SERIAL instead of UUID
SELECT setval(pg_get_serial_sequence('table_name', 'id'), (SELECT MAX(id) FROM table_name));
```

### 3. Enable Realtime
```sql
-- Enable realtime for cleo_messages
ALTER PUBLICATION supabase_realtime ADD TABLE cleo_messages;
```

### 4. Verify RLS Policies
```sql
-- Ensure RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 5. Create Auth Users

The export does NOT include auth.users (Supabase manages this).
Users will need to:
- Sign up again, OR
- Be migrated using Supabase Auth Admin API

```javascript
// Migrate auth users (requires auth.users export from original project)
const { data, error } = await supabase.auth.admin.createUser({
  email: 'user@example.com',
  password: 'temporary-password',
  email_confirm: true,
  user_metadata: { first_name: 'John', last_name: 'Doe' }
});
```

### 6. Set Edge Function Secrets

In the new Supabase project dashboard, add these secrets:
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`

### 7. Create Storage Buckets

```sql
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('course-images', 'course-images', true),
  ('content-videos', 'content-videos', true),
  ('exam-board-specifications', 'exam-board-specifications', false);
```

## Troubleshooting

### Foreign Key Violations
If you get foreign key errors, ensure you're importing in the correct order.
You can temporarily disable foreign key checks:

```sql
SET session_replication_role = replica;
-- Run your inserts
SET session_replication_role = DEFAULT;
```

### Duplicate Key Errors
If re-running import, clear tables first:

```sql
TRUNCATE TABLE table_name CASCADE;
```

### Large Data Sets
For tables with >10,000 rows, consider:
1. Using `COPY` command instead of INSERT
2. Splitting into multiple import batches
3. Temporarily disabling triggers

```sql
ALTER TABLE table_name DISABLE TRIGGER ALL;
-- Import data
ALTER TABLE table_name ENABLE TRIGGER ALL;
```

## Verification Checklist

- [ ] All tables have expected row counts
- [ ] Foreign key relationships are intact
- [ ] RLS policies are working (test with non-admin user)
- [ ] Realtime subscriptions work on cleo_messages
- [ ] Edge functions can query all tables
- [ ] Storage buckets accessible
- [ ] Auth users can sign in and access their data
