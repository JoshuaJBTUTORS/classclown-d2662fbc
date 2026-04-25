-- Restore the canonical shared Review Room URL for all Review Room lessons
UPDATE public.lessons
SET
  lesson_space_room_url = 'https://www.thelessonspace.com/space/3b3388bf-7e1f-4276-9f37-de5b17053e84',
  lesson_space_room_id = NULL,
  lesson_space_space_id = NULL,
  lesson_space_session_id = NULL
WHERE lesson_type = 'review_room';

-- Remove any per-participant launch URLs that were generated for Review Room lessons
DELETE FROM public.lesson_participant_urls
WHERE lesson_id IN (
  SELECT id FROM public.lessons WHERE lesson_type = 'review_room'
);
