-- Enroll admin/owner users in Testing Course
INSERT INTO user_courses (user_id, course_id, source, is_auto_generated, progress_percentage)
VALUES 
  -- joshuaekundayo1@gmail.com (owner)
  ('8c9c0bef-5d7a-47ce-8481-b750dbd2f2a4', 'b4dd840a-c5f1-4660-bab5-6d7a8e3826a9', 'manual', false, 0),
  -- joshua@jb-tutors.com (admin)
  ('12f88a55-1ed6-42ae-857a-4b2d30aa58fe', 'b4dd840a-c5f1-4660-bab5-6d7a8e3826a9', 'manual', false, 0),
  -- demo.owner@jb-tutors.com (owner)
  ('96114d42-e217-4596-a8ea-a066869678e1', 'b4dd840a-c5f1-4660-bab5-6d7a8e3826a9', 'manual', false, 0)
ON CONFLICT (user_id, course_id) DO NOTHING;