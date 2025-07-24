-- Add RLS policy to allow tutors to view students enrolled in their lessons
CREATE POLICY "Tutors can view their lesson students" 
ON public.students 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN lesson_students ls ON l.id = ls.lesson_id
    WHERE ls.student_id = students.id
    AND l.tutor_id = get_current_user_tutor_id()
  )
);