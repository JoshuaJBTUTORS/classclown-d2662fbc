-- Add unique constraint for lesson_student_summaries to support proper upsert
ALTER TABLE public.lesson_student_summaries 
ADD CONSTRAINT lesson_student_summaries_unique 
UNIQUE (lesson_id, student_id, transcription_id);