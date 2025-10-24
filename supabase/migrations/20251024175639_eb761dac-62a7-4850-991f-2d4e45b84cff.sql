-- Make lesson_id nullable in topic_requests table to allow general topic requests without a specific lesson
ALTER TABLE public.topic_requests 
ALTER COLUMN lesson_id DROP NOT NULL;