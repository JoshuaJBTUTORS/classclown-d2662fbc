UPDATE public.lessons
SET lesson_type = 'review_room'
WHERE subject ILIKE '%review room%'
  AND lesson_type = 'regular';