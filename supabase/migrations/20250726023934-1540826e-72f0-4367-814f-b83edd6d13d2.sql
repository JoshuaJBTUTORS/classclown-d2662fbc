-- Enable RLS on the new tables to fix security warnings
ALTER TABLE lesson_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_student_summaries ENABLE ROW LEVEL SECURITY;