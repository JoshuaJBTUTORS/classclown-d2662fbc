-- Update RLS policies for teaching_materials table to allow tutors to upload materials

-- Allow tutors to insert teaching materials
CREATE POLICY "Tutors can insert teaching materials" 
ON teaching_materials 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('tutor', 'admin', 'owner')
  )
);

-- Allow tutors to update their own materials and admins/owners to update all
CREATE POLICY "Users can update their own materials or admins can update all" 
ON teaching_materials 
FOR UPDATE 
USING (
  uploaded_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Restrict delete to only admins and owners
CREATE POLICY "Only admins and owners can delete teaching materials" 
ON teaching_materials 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);