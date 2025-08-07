-- Create assessment sessions for Paul (student_id 220) with improving scores over time
-- Using an existing user_id from the auth.users table

-- Session 1: July 25, 2025 - GCSE Chemistry (Chemical Analysis) - 32% score
INSERT INTO assessment_sessions (
  id,
  assessment_id,
  user_id,
  student_id,
  status,
  started_at,
  completed_at,
  total_marks_achieved,
  total_marks_available,
  time_taken_minutes,
  attempt_number,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1242969c-badb-4c71-9726-904ce576061f', -- Chemical Analysis
  '14fbb466-ab95-4257-a747-54a742d2616a', -- Existing user_id
  220, -- Paul's student_id
  'completed',
  '2025-07-25 14:00:00+00',
  '2025-07-25 15:15:00+00',
  16, -- 32% of 50 marks
  50,
  75,
  1,
  '2025-07-25 14:00:00+00',
  '2025-07-25 15:15:00+00'
);

-- Session 2: July 31, 2025 - GCSE Biology - 48% score  
INSERT INTO assessment_sessions (
  id,
  assessment_id,
  user_id,
  student_id,
  status,
  started_at,
  completed_at,
  total_marks_achieved,
  total_marks_available,
  time_taken_minutes,
  attempt_number,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '0c0ccd2e-76d8-4c1c-b826-485eac4fde13', -- GCSE Biology Exam
  '14fbb466-ab95-4257-a747-54a742d2616a',
  220,
  'completed',
  '2025-07-31 10:00:00+00',
  '2025-07-31 11:30:00+00',
  24, -- 48% of 50 marks
  50,
  90,
  1,
  '2025-07-31 10:00:00+00',
  '2025-07-31 11:30:00+00'
);

-- Session 3: August 5, 2025 - GCSE Chemistry (Bonding) - 62% score
INSERT INTO assessment_sessions (
  id,
  assessment_id,
  user_id,
  student_id,
  status,
  started_at,
  completed_at,
  total_marks_achieved,
  total_marks_available,
  time_taken_minutes,
  attempt_number,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '02c9723d-5724-42a2-aaff-6ddc4eedde13', -- Bonding, Structure & Properties
  '14fbb466-ab95-4257-a747-54a742d2616a',
  220,
  'completed',
  '2025-08-05 13:00:00+00',
  '2025-08-05 14:20:00+00',
  31, -- 62% of 50 marks
  50,
  80,
  1,
  '2025-08-05 13:00:00+00',
  '2025-08-05 14:20:00+00'
);

-- Session 4: August 6, 2025 - GCSE Physics (Energy) - 74% score
INSERT INTO assessment_sessions (
  id,
  assessment_id,
  user_id,
  student_id,
  status,
  started_at,
  completed_at,
  total_marks_achieved,
  total_marks_available,
  time_taken_minutes,
  attempt_number,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'e91d9506-391f-452b-a5ae-ef903821a177', -- GCSE Physics Energy
  '14fbb466-ab95-4257-a747-54a742d2616a',
  220,
  'completed',
  '2025-08-06 15:00:00+00',
  '2025-08-06 16:10:00+00',
  37, -- 74% of 50 marks
  50,
  70,
  1,
  '2025-08-06 15:00:00+00',
  '2025-08-06 16:10:00+00'
);

-- Session 5: August 7, 2025 - GCSE Biology (Retake) - 85% score
INSERT INTO assessment_sessions (
  id,
  assessment_id,
  user_id,
  student_id,
  status,
  started_at,
  completed_at,
  total_marks_achieved,
  total_marks_available,
  time_taken_minutes,
  attempt_number,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '0c0ccd2e-76d8-4c1c-b826-485eac4fde13', -- GCSE Biology Exam (retake)
  '14fbb466-ab95-4257-a747-54a742d2616a',
  220,
  'completed',
  '2025-08-07 11:00:00+00',
  '2025-08-07 12:00:00+00',
  42, -- 85% of 50 marks  
  50,
  60,
  2, -- Second attempt
  '2025-08-07 11:00:00+00',
  '2025-08-07 12:00:00+00'
);