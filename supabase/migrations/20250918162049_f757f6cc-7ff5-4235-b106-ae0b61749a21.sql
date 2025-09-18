-- Make student_id nullable in topic_requests table to allow requests without specific student selection
ALTER TABLE public.topic_requests 
ALTER COLUMN student_id DROP NOT NULL;