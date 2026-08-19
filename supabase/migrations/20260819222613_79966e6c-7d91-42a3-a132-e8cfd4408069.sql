UPDATE public.lessons
SET lesson_space_session_id = NULL,
    lesson_space_recording_url = NULL
WHERE start_time > now()
  AND (lesson_space_session_id IS NOT NULL OR lesson_space_recording_url IS NOT NULL);