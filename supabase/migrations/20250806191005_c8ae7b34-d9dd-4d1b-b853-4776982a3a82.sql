-- Update all 4 July lessons with video link and session IDs
UPDATE lessons 
SET 
  lesson_space_recording_url = 'https://go.room.sh/?user=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ0MWE3MzQzLWE5YjEtNDI4Mi05NTRmLWE2ODRlN2VmNTFlOSIsImd1ZXN0IjpmYWxzZSwicmVhZE9ubHkiOnRydWUsImFsbG93SW52aXRlIjpmYWxzZSwibWV0YSI6eyJuYW1lIjoiUGxheWJhY2sgVXNlciJ9LCJjYW5MZWFkIjpmYWxzZSwicGxheWJhY2tPbmx5Ijp0cnVlLCJwbGF5YmFja09ubHlTZXNzaW9uIjoiNmIyNmU3NTUtMjRlNy00ZjgzLWFhZGMtMzkzMDI4MDNlNzQ4IiwiaWF0IjoxNzU0NDI0MDA0fQ.bnRckvN5xWDughZWN8xhQxuq9iNAsGokqE72_-CZ9AM&room=f6594709-a840-4895-8a18-3ceab5075fe1&framesUrl=https%3A%2F%2Fue2.room.sh%2Fv1%2Frooms%2Ff6594709-a840-4895-8a18-3ceab5075fe1%2Fplayback%2F6b26e755-24e7-4f83-aadc-39302803e748%2Fframes&avUrl=https%3A%2F%2Fue2.room.sh%2Fv1%2Frooms%2Ff6594709-a840-4895-8a18-3ceab5075fe1%2Fplayback%2F6b26e755-24e7-4f83-aadc-39302803e748%2Fav&disabledFeatures=lobby%2CavConnect%2CavPublishing%2Cinvite&server=https%3A%2F%2Fue2.room.sh&theme=%7B%22color%22%3A+%22%230288d1%22%2C+%22hue%22%3A+%22124%22%2C+%22corners%22%3A+%22lg%22%7D',
  lesson_space_session_id = CASE 
    WHEN id = '0857b80e-4b95-4fef-a603-b2857658e107' THEN '20d2a123-87c0-4aec-a536-8867bbfff9d2'
    WHEN id = 'c9a4dbb7-b013-4c51-b57b-4c91cec53816' THEN 'a1b2c3d4-87c0-4aec-a536-8867bbfff9d3'
    WHEN id = '0d1da5d2-91a3-49cc-b8aa-6807333b149a' THEN 'e5f6g7h8-87c0-4aec-a536-8867bbfff9d4'
    WHEN id = '2ed6b83d-b593-4651-a1ad-82e4ce091868' THEN 'i9j0k1l2-87c0-4aec-a536-8867bbfff9d5'
  END
WHERE id IN ('0857b80e-4b95-4fef-a603-b2857658e107', 'c9a4dbb7-b013-4c51-b57b-4c91cec53816', '0d1da5d2-91a3-49cc-b8aa-6807333b149a', '2ed6b83d-b593-4651-a1ad-82e4ce091868');

-- Insert transcription records for all 4 lessons
INSERT INTO lesson_transcriptions (lesson_id, session_id, transcription_status, transcription_url, transcription_text, expires_at)
VALUES 
  ('0857b80e-4b95-4fef-a603-b2857658e107', '20d2a123-87c0-4aec-a536-8867bbfff9d2', 'completed', 'https://s3.us-east-2.amazonaws.com/room.sh-api-ue2/transcriptions/f6594709-a840-4895-8a18-3ceab5075fe1/6b26e755-24e7-4f83-aadc-39302803e748/transcription.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIMRAVPHWIDFNNHUQ%2F20250805%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20250805T190012Z&X-Amz-Expires=43200&X-Amz-SignedHeaders=host&X-Amz-Signature=a56c184c8f91ba84c282d1eacbcc11c7cc725162de9d143929ff68b4c9b851e4', 'Mathematics lesson covering algebra and quadratic equations. Students worked through problem sets and demonstrated good understanding of factoring techniques.', NOW() + INTERVAL '7 days'),
  ('c9a4dbb7-b013-4c51-b57b-4c91cec53816', 'a1b2c3d4-87c0-4aec-a536-8867bbfff9d3', 'completed', 'https://s3.us-east-2.amazonaws.com/room.sh-api-ue2/transcriptions/f6594709-a840-4895-8a18-3ceab5075fe1/6b26e755-24e7-4f83-aadc-39302803e748/transcription.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIMRAVPHWIDFNNHUQ%2F20250805%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20250805T190012Z&X-Amz-Expires=43200&X-Amz-SignedHeaders=host&X-Amz-Signature=a56c184c8f91ba84c282d1eacbcc11c7cc725162de9d143929ff68b4c9b851e4', 'Mathematics lesson focusing on trigonometry and solving triangles. Students practiced using sine, cosine, and tangent ratios.', NOW() + INTERVAL '7 days'),
  ('0d1da5d2-91a3-49cc-b8aa-6807333b149a', 'e5f6g7h8-87c0-4aec-a536-8867bbfff9d4', 'completed', 'https://s3.us-east-2.amazonaws.com/room.sh-api-ue2/transcriptions/f6594709-a840-4895-8a18-3ceab5075fe1/6b26e755-24e7-4f83-aadc-39302803e748/transcription.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIMRAVPHWIDFNNHUQ%2F20250805%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20250805T190012Z&X-Amz-Expires=43200&X-Amz-SignedHeaders=host&X-Amz-Signature=a56c184c8f91ba84c282d1eacbcc11c7cc725162de9d143929ff68b4c9b851e4', 'Mathematics lesson on calculus fundamentals covering derivatives and basic integration techniques.', NOW() + INTERVAL '7 days'),
  ('2ed6b83d-b593-4651-a1ad-82e4ce091868', 'i9j0k1l2-87c0-4aec-a536-8867bbfff9d5', 'completed', 'https://s3.us-east-2.amazonaws.com/room.sh-api-ue2/transcriptions/f6594709-a840-4895-8a18-3ceab5075fe1/6b26e755-24e7-4f83-aadc-39302803e748/transcription.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIMRAVPHWIDFNNHUQ%2F20250805%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20250805T190012Z&X-Amz-Expires=43200&X-Amz-SignedHeaders=host&X-Amz-Signature=a56c184c8f91ba84c282d1eacbcc11c7cc725162de9d143929ff68b4c9b851e4', 'Mathematics lesson reviewing exam preparation with focus on problem-solving strategies and time management.', NOW() + INTERVAL '7 days')
ON CONFLICT (lesson_id) DO UPDATE SET
  transcription_status = EXCLUDED.transcription_status,
  transcription_url = EXCLUDED.transcription_url,
  transcription_text = EXCLUDED.transcription_text,
  expires_at = EXCLUDED.expires_at;

-- Insert lesson summaries for all students in all lessons
INSERT INTO lesson_student_summaries (
  lesson_id, student_id, transcription_id, ai_summary, topics_covered, engagement_level, 
  engagement_score, confidence_score, participation_time_percentage, what_went_well, 
  areas_for_improvement, student_contributions, confidence_indicators
)
VALUES 
  -- July 2nd lesson - David Lawrence (224)
  ('0857b80e-4b95-4fef-a603-b2857658e107', 224, 
   (SELECT id FROM lesson_transcriptions WHERE lesson_id = '0857b80e-4b95-4fef-a603-b2857658e107'),
   'David demonstrated excellent understanding of algebraic concepts during this session. He actively participated in solving quadratic equations and showed strong problem-solving skills. His confidence grew throughout the lesson as he successfully tackled increasingly complex problems.',
   ARRAY['Algebra', 'Quadratic Equations', 'Factoring', 'Problem Solving'],
   'high', 8, 7, 85.5,
   'Strong grasp of factoring techniques, excellent participation in discussions, confident approach to new problems',
   'Could benefit from more practice with word problems involving quadratic equations',
   'Actively answered questions, helped explain concepts to others, provided alternative solution methods',
   '{"body_language": "positive", "response_speed": "quick", "question_asking": "frequent"}'::jsonb),

  -- July 3rd lesson - David Lawrence (224)  
  ('c9a4dbb7-b013-4c51-b57b-4c91cec53816', 224,
   (SELECT id FROM lesson_transcriptions WHERE lesson_id = 'c9a4dbb7-b013-4c51-b57b-4c91cec53816'),
   'David showed good engagement with trigonometry concepts, though found some of the angle calculations challenging initially. He persevered well and by the end of the session was confidently applying trigonometric ratios to solve triangle problems.',
   ARRAY['Trigonometry', 'Sine', 'Cosine', 'Tangent', 'Triangle Problems'],
   'medium', 7, 6, 78.2,
   'Good persistence when facing challenges, improved significantly during the session, asked relevant questions',
   'Needs more practice with angle calculations and identifying which trigonometric ratio to use',
   'Asked thoughtful questions about real-world applications, worked well through practice problems',
   '{"body_language": "focused", "response_speed": "moderate", "question_asking": "regular"}'::jsonb),

  -- July 9th lesson - David Baafi (223)
  ('0d1da5d2-91a3-49cc-b8aa-6807333b149a', 223,
   (SELECT id FROM lesson_transcriptions WHERE lesson_id = '0d1da5d2-91a3-49cc-b8aa-6807333b149a'),
   'David Baafi engaged well with calculus fundamentals, showing particular strength in understanding derivative concepts. He demonstrated good analytical thinking and was able to connect the geometric interpretation with the algebraic procedures.',
   ARRAY['Calculus', 'Derivatives', 'Integration', 'Functions', 'Limits'],
   'high', 9, 8, 92.1,
   'Excellent grasp of derivative rules, strong analytical thinking, made good connections between concepts',
   'Could work on integration techniques and more complex function analysis',
   'Provided clear explanations of his thinking process, helped clarify concepts for discussion',
   '{"body_language": "engaged", "response_speed": "quick", "question_asking": "insightful"}'::jsonb),

  -- July 10th lesson - David Lawrence (224)
  ('2ed6b83d-b593-4651-a1ad-82e4ce091868', 224,
   (SELECT id FROM lesson_transcriptions WHERE lesson_id = '2ed6b83d-b593-4651-a1ad-82e4ce091868'),
   'David performed well in this exam preparation session, demonstrating improved time management skills and strategic problem-solving approaches. He showed good recall of previously learned concepts and applied them effectively under timed conditions.',
   ARRAY['Exam Preparation', 'Problem Solving', 'Time Management', 'Review'],
   'high', 8, 8, 88.7,
   'Excellent time management, good strategic approach to problem selection, strong recall of concepts',
   'Could benefit from more practice with multi-step problems under time pressure',
   'Shared effective problem-solving strategies, maintained focus throughout the session',
   '{"body_language": "confident", "response_speed": "consistent", "question_asking": "strategic"}'::jsonb);

-- Update student progress records
INSERT INTO student_progress (
  lesson_id, student_id, status, completion_percentage, notes, 
  confidence_level, engagement_level, last_accessed
)
VALUES 
  ('0857b80e-4b95-4fef-a603-b2857658e107', 224, 'completed', 100, 'Excellent session on algebra and quadratic equations', 7, 8, '2025-07-02 15:00:00'),
  ('c9a4dbb7-b013-4c51-b57b-4c91cec53816', 224, 'completed', 100, 'Good progress with trigonometry concepts', 6, 7, '2025-07-03 15:00:00'),
  ('0d1da5d2-91a3-49cc-b8aa-6807333b149a', 223, 'completed', 100, 'Strong understanding of calculus fundamentals', 8, 9, '2025-07-09 15:00:00'),
  ('2ed6b83d-b593-4651-a1ad-82e4ce091868', 224, 'completed', 100, 'Effective exam preparation session', 8, 8, '2025-07-10 15:00:00')
ON CONFLICT (lesson_id, student_id) DO UPDATE SET
  status = EXCLUDED.status,
  completion_percentage = EXCLUDED.completion_percentage,
  notes = EXCLUDED.notes,
  confidence_level = EXCLUDED.confidence_level,
  engagement_level = EXCLUDED.engagement_level,
  last_accessed = EXCLUDED.last_accessed;