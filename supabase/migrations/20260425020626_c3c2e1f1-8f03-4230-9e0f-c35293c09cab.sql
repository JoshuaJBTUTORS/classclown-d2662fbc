-- Promote the Sunday Review Room lessons to lesson_type = 'review_room'
-- and force the fixed shared Lessonspace URL on all Review Room lessons.

UPDATE public.lessons
SET 
  lesson_type = 'review_room',
  lesson_space_room_url = 'https://www.thelessonspace.com/space/3b3388bf-7e1f-4276-9f37-de5b17053e84',
  lesson_space_room_id = NULL,
  lesson_space_space_id = NULL,
  lesson_space_session_id = NULL,
  updated_at = NOW()
WHERE subject ILIKE '%review room%'
  AND (
    lesson_type IS DISTINCT FROM 'review_room'
    OR lesson_space_room_url IS DISTINCT FROM 'https://www.thelessonspace.com/space/3b3388bf-7e1f-4276-9f37-de5b17053e84'
    OR lesson_space_room_id IS NOT NULL
    OR lesson_space_space_id IS NOT NULL
  );

-- Clear any per-participant URLs for Review Room lessons so the shared link is always used
DELETE FROM public.lesson_participant_urls
WHERE lesson_id IN (
  SELECT id FROM public.lessons WHERE lesson_type = 'review_room'
);