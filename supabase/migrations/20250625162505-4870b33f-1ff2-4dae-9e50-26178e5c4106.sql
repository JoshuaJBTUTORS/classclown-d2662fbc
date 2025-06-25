
-- Create lesson plans table to store curriculum data
CREATE TABLE lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 52),
  term TEXT NOT NULL,
  topic_title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subject, week_number)
);

-- Create lesson_plan_assignments table to link lessons to curriculum
CREATE TABLE lesson_plan_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  lesson_plan_id UUID NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
  assigned_week_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lesson_id)
);

-- Create recurring_lesson_groups table to track recurring lesson series
CREATE TABLE recurring_lesson_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  recurrence_pattern JSONB NOT NULL DEFAULT '{}',
  next_extension_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_lesson_plans_subject_week ON lesson_plans(subject, week_number);
CREATE INDEX idx_lesson_plan_assignments_lesson ON lesson_plan_assignments(lesson_id);
CREATE INDEX idx_recurring_groups_original ON recurring_lesson_groups(original_lesson_id);
CREATE INDEX idx_recurring_groups_extension ON recurring_lesson_groups(next_extension_date);

-- Insert GCSE Chemistry & Year 11 Chemistry curriculum
INSERT INTO lesson_plans (subject, week_number, term, topic_title, description) VALUES
-- Autumn Term (September - December)
('GCSE Chemistry', 1, 'Autumn', 'History of Atomic Structure', 'Week 1 (Sep): History of Atomic Structure'),
('GCSE Chemistry', 2, 'Autumn', 'Periodic Table – Groups and Trends', 'Week 2 (Sep): Periodic Table – Groups and Trends'),
('GCSE Chemistry', 3, 'Autumn', 'Electronic Structure and Ion Formation', 'Week 3 (Sep): Electronic Structure and Ion Formation'),
('GCSE Chemistry', 4, 'Autumn', 'Ionic Bonding and Properties', 'Week 4 (Oct): Ionic Bonding and Properties'),
('GCSE Chemistry', 5, 'Autumn', 'Covalent Bonding and Properties', 'Week 5 (Oct): Covalent Bonding and Properties'),
('GCSE Chemistry', 6, 'Autumn', 'Metallic Bonding – Structure and Conductivity', 'Week 6 (Oct): Metallic Bonding – Structure and Conductivity'),
('GCSE Chemistry', 7, 'Autumn', 'Relative Formula Mass and Empirical Formulae', 'Week 7 (Nov): Relative Formula Mass and Empirical Formulae'),
('GCSE Chemistry', 8, 'Autumn', 'Calculating Using Moles (Higher Tier)', 'Week 8 (Nov): Calculating Using Moles (Higher Tier)'),
('GCSE Chemistry', 9, 'Autumn', 'Concentrations of Solutions and Atom Economy', 'Week 9 (Nov): Concentrations of Solutions and Atom Economy'),
('GCSE Chemistry', 10, 'Autumn', 'Reactions of Acids and Metals', 'Week 10 (Dec): Reactions of Acids and Metals'),
('GCSE Chemistry', 11, 'Autumn', 'Electrolysis and Applications', 'Week 11 (Dec): Electrolysis and Applications'),
('GCSE Chemistry', 12, 'Autumn', 'Examination Week – Past Papers and Exam Skills', 'Week 12 (Dec): Examination Week – Past Papers and Exam Skills'),

-- Spring Term (January - March)
('GCSE Chemistry', 13, 'Spring', 'Metals and Reactivity Series', 'Week 1 (Jan): Metals and Reactivity Series'),
('GCSE Chemistry', 14, 'Spring', 'Extraction of Metals and Alloys', 'Week 2 (Jan): Extraction of Metals and Alloys'),
('GCSE Chemistry', 15, 'Spring', 'Acids and Bases – Neutralization Reactions', 'Week 3 (Jan): Acids and Bases – Neutralization Reactions'),
('GCSE Chemistry', 16, 'Spring', 'Energy Transfers in Reactions', 'Week 4 (Feb): Energy Transfers in Reactions'),
('GCSE Chemistry', 17, 'Spring', 'Endothermic and Exothermic Reactions', 'Week 5 (Feb): Endothermic and Exothermic Reactions'),
('GCSE Chemistry', 18, 'Spring', 'Electrochemical Cells', 'Week 6 (Feb): Electrochemical Cells'),
('GCSE Chemistry', 19, 'Spring', 'Factors Affecting Reaction Rates', 'Week 7 (Mar): Factors Affecting Reaction Rates'),
('GCSE Chemistry', 20, 'Spring', 'Catalysts and Reversible Reactions', 'Week 8 (Mar): Catalysts and Reversible Reactions'),
('GCSE Chemistry', 21, 'Spring', 'Equilibrium – Le Chatelier''s Principle', 'Week 9 (Mar): Equilibrium – Le Chatelier''s Principle'),
('GCSE Chemistry', 22, 'Spring', 'Examination Week – Application and Problem Solving', 'Week 10 (Mar): Examination Week – Application and Problem Solving'),

-- Summer Term (April - July)
('GCSE Chemistry', 23, 'Summer', 'Hydrocarbons and Alkanes', 'Week 1 (Apr): Hydrocarbons and Alkanes'),
('GCSE Chemistry', 24, 'Summer', 'Alkenes and Reactions', 'Week 2 (Apr): Alkenes and Reactions'),
('GCSE Chemistry', 25, 'Summer', 'Polymers – Addition and Condensation', 'Week 3 (Apr): Polymers – Addition and Condensation'),
('GCSE Chemistry', 26, 'Summer', 'Pure Substances and Formulations', 'Week 4 (May): Pure Substances and Formulations'),
('GCSE Chemistry', 27, 'Summer', 'Chromatography – Techniques and Uses', 'Week 5 (May): Chromatography – Techniques and Uses'),
('GCSE Chemistry', 28, 'Summer', 'Chemical Tests – Gases and Ions', 'Week 6 (May): Chemical Tests – Gases and Ions'),
('GCSE Chemistry', 29, 'Summer', 'Composition of the Atmosphere', 'Week 7 (Jun): Composition of the Atmosphere'),
('GCSE Chemistry', 30, 'Summer', 'Greenhouse Gases and Climate Change', 'Week 8 (Jun): Greenhouse Gases and Climate Change'),
('GCSE Chemistry', 31, 'Summer', 'Carbon Footprints and Reduction Strategies', 'Week 9 (Jun): Carbon Footprints and Reduction Strategies'),
('GCSE Chemistry', 32, 'Summer', 'Life Cycle Assessments', 'Week 10 (Jul): Life Cycle Assessments'),
('GCSE Chemistry', 33, 'Summer', 'Reducing Resource Use and Recycling', 'Week 11 (Jul): Reducing Resource Use and Recycling'),
('GCSE Chemistry', 34, 'Summer', 'Examination Week – Mock Papers', 'Week 12 (Jul): Examination Week – Mock Papers'),

-- Winter Term (August)
('GCSE Chemistry', 35, 'Winter', 'Rounding, Significant Figures, and Unit Conversions', 'Week 1 (Aug): Rounding, Significant Figures, and Unit Conversions'),
('GCSE Chemistry', 36, 'Winter', 'Rearranging Equations and Graph Interpretation', 'Week 2 (Aug): Rearranging Equations and Graph Interpretation'),
('GCSE Chemistry', 37, 'Winter', 'Data Analysis – Errors, Uncertainty, and Peer Review', 'Week 3 (Aug): Data Analysis – Errors, Uncertainty, and Peer Review'),
('GCSE Chemistry', 38, 'Winter', 'Final Examination Week – Comprehensive Exam Practice', 'Week 4 (Aug): Final Examination Week – Comprehensive Exam Practice'),

-- Repeat the same for Year 11 Chemistry
('Year 11 Chemistry', 1, 'Autumn', 'History of Atomic Structure', 'Week 1 (Sep): History of Atomic Structure'),
('Year 11 Chemistry', 2, 'Autumn', 'Periodic Table – Groups and Trends', 'Week 2 (Sep): Periodic Table – Groups and Trends'),
('Year 11 Chemistry', 3, 'Autumn', 'Electronic Structure and Ion Formation', 'Week 3 (Sep): Electronic Structure and Ion Formation'),
('Year 11 Chemistry', 4, 'Autumn', 'Ionic Bonding and Properties', 'Week 4 (Oct): Ionic Bonding and Properties'),
('Year 11 Chemistry', 5, 'Autumn', 'Covalent Bonding and Properties', 'Week 5 (Oct): Covalent Bonding and Properties'),
('Year 11 Chemistry', 6, 'Autumn', 'Metallic Bonding – Structure and Conductivity', 'Week 6 (Oct): Metallic Bonding – Structure and Conductivity'),
('Year 11 Chemistry', 7, 'Autumn', 'Relative Formula Mass and Empirical Formulae', 'Week 7 (Nov): Relative Formula Mass and Empirical Formulae'),
('Year 11 Chemistry', 8, 'Autumn', 'Calculating Using Moles (Higher Tier)', 'Week 8 (Nov): Calculating Using Moles (Higher Tier)'),
('Year 11 Chemistry', 9, 'Autumn', 'Concentrations of Solutions and Atom Economy', 'Week 9 (Nov): Concentrations of Solutions and Atom Economy'),
('Year 11 Chemistry', 10, 'Autumn', 'Reactions of Acids and Metals', 'Week 10 (Dec): Reactions of Acids and Metals'),
('Year 11 Chemistry', 11, 'Autumn', 'Electrolysis and Applications', 'Week 11 (Dec): Electrolysis and Applications'),
('Year 11 Chemistry', 12, 'Autumn', 'Examination Week – Past Papers and Exam Skills', 'Week 12 (Dec): Examination Week – Past Papers and Exam Skills'),
('Year 11 Chemistry', 13, 'Spring', 'Metals and Reactivity Series', 'Week 1 (Jan): Metals and Reactivity Series'),
('Year 11 Chemistry', 14, 'Spring', 'Extraction of Metals and Alloys', 'Week 2 (Jan): Extraction of Metals and Alloys'),
('Year 11 Chemistry', 15, 'Spring', 'Acids and Bases – Neutralization Reactions', 'Week 3 (Jan): Acids and Bases – Neutralization Reactions'),
('Year 11 Chemistry', 16, 'Spring', 'Energy Transfers in Reactions', 'Week 4 (Feb): Energy Transfers in Reactions'),
('Year 11 Chemistry', 17, 'Spring', 'Endothermic and Exothermic Reactions', 'Week 5 (Feb): Endothermic and Exothermic Reactions'),
('Year 11 Chemistry', 18, 'Spring', 'Electrochemical Cells', 'Week 6 (Feb): Electrochemical Cells'),
('Year 11 Chemistry', 19, 'Spring', 'Factors Affecting Reaction Rates', 'Week 7 (Mar): Factors Affecting Reaction Rates'),
('Year 11 Chemistry', 20, 'Spring', 'Catalysts and Reversible Reactions', 'Week 8 (Mar): Catalysts and Reversible Reactions'),
('Year 11 Chemistry', 21, 'Spring', 'Equilibrium – Le Chatelier''s Principle', 'Week 9 (Mar): Equilibrium – Le Chatelier''s Principle'),
('Year 11 Chemistry', 22, 'Spring', 'Examination Week – Application and Problem Solving', 'Week 10 (Mar): Examination Week – Application and Problem Solving'),
('Year 11 Chemistry', 23, 'Summer', 'Hydrocarbons and Alkanes', 'Week 1 (Apr): Hydrocarbons and Alkanes'),
('Year 11 Chemistry', 24, 'Summer', 'Alkenes and Reactions', 'Week 2 (Apr): Alkenes and Reactions'),
('Year 11 Chemistry', 25, 'Summer', 'Polymers – Addition and Condensation', 'Week 3 (Apr): Polymers – Addition and Condensation'),
('Year 11 Chemistry', 26, 'Summer', 'Pure Substances and Formulations', 'Week 4 (May): Pure Substances and Formulations'),
('Year 11 Chemistry', 27, 'Summer', 'Chromatography – Techniques and Uses', 'Week 5 (May): Chromatography – Techniques and Uses'),
('Year 11 Chemistry', 28, 'Summer', 'Chemical Tests – Gases and Ions', 'Week 6 (May): Chemical Tests – Gases and Ions'),
('Year 11 Chemistry', 29, 'Summer', 'Composition of the Atmosphere', 'Week 7 (Jun): Composition of the Atmosphere'),
('Year 11 Chemistry', 30, 'Summer', 'Greenhouse Gases and Climate Change', 'Week 8 (Jun): Greenhouse Gases and Climate Change'),
('Year 11 Chemistry', 31, 'Summer', 'Carbon Footprints and Reduction Strategies', 'Week 9 (Jun): Carbon Footprints and Reduction Strategies'),
('Year 11 Chemistry', 32, 'Summer', 'Life Cycle Assessments', 'Week 10 (Jul): Life Cycle Assessments'),
('Year 11 Chemistry', 33, 'Summer', 'Reducing Resource Use and Recycling', 'Week 11 (Jul): Reducing Resource Use and Recycling'),
('Year 11 Chemistry', 34, 'Summer', 'Examination Week – Mock Papers', 'Week 12 (Jul): Examination Week – Mock Papers'),
('Year 11 Chemistry', 35, 'Winter', 'Rounding, Significant Figures, and Unit Conversions', 'Week 1 (Aug): Rounding, Significant Figures, and Unit Conversions'),
('Year 11 Chemistry', 36, 'Winter', 'Rearranging Equations and Graph Interpretation', 'Week 2 (Aug): Rearranging Equations and Graph Interpretation'),
('Year 11 Chemistry', 37, 'Winter', 'Data Analysis – Errors, Uncertainty, and Peer Review', 'Week 3 (Aug): Data Analysis – Errors, Uncertainty, and Peer Review'),
('Year 11 Chemistry', 38, 'Winter', 'Final Examination Week – Comprehensive Exam Practice', 'Week 4 (Aug): Final Examination Week – Comprehensive Exam Practice');

-- Enable Row Level Security for new tables
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plan_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_lesson_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lesson_plans (viewable by all authenticated users)
CREATE POLICY "Anyone can view lesson plans" ON lesson_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify lesson plans" ON lesson_plans FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Create RLS policies for lesson_plan_assignments 
CREATE POLICY "Users can view lesson plan assignments for their lessons" ON lesson_plan_assignments FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE l.id = lesson_plan_assignments.lesson_id
    AND (
      ur.role IN ('admin', 'owner')
      OR (ur.role = 'tutor' AND l.tutor_id = get_current_user_tutor_id())
      OR (ur.role IN ('student', 'parent') AND EXISTS (
        SELECT 1 FROM lesson_students ls
        WHERE ls.lesson_id = l.id
        AND (
          ls.student_id = get_current_user_student_id()
          OR ls.student_id IN (
            SELECT s.id FROM students s WHERE s.parent_id = get_current_user_parent_id()
          )
        )
      ))
    )
  )
);

CREATE POLICY "Admins and tutors can manage lesson plan assignments" ON lesson_plan_assignments FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE l.id = lesson_plan_assignments.lesson_id
    AND (
      ur.role IN ('admin', 'owner')
      OR (ur.role = 'tutor' AND l.tutor_id = get_current_user_tutor_id())
    )
  )
);

-- Create RLS policies for recurring_lesson_groups
CREATE POLICY "Users can view recurring groups for their lessons" ON recurring_lesson_groups FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE l.id = recurring_lesson_groups.original_lesson_id
    AND (
      ur.role IN ('admin', 'owner')
      OR (ur.role = 'tutor' AND l.tutor_id = get_current_user_tutor_id())
      OR (ur.role IN ('student', 'parent') AND EXISTS (
        SELECT 1 FROM lesson_students ls
        WHERE ls.lesson_id = l.id
        AND (
          ls.student_id = get_current_user_student_id()
          OR ls.student_id IN (
            SELECT s.id FROM students s WHERE s.parent_id = get_current_user_parent_id()
          )
        )
      ))
    )
  )
);

CREATE POLICY "Admins and tutors can manage recurring groups" ON recurring_lesson_groups FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE l.id = recurring_lesson_groups.original_lesson_id
    AND (
      ur.role IN ('admin', 'owner')
      OR (ur.role = 'tutor' AND l.tutor_id = get_current_user_tutor_id())
    )
  )
);

-- Create function to extend recurring lessons (fixed variable naming)
CREATE OR REPLACE FUNCTION extend_recurring_lessons()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recurring_group RECORD;
  lesson_record RECORD;
  new_lesson_id UUID;
  working_date DATE;
  extension_date DATE;
  days_to_add INTEGER;
BEGIN
  -- Get all recurring groups that need extension
  FOR recurring_group IN 
    SELECT * FROM recurring_lesson_groups 
    WHERE next_extension_date <= NOW() + INTERVAL '7 days'
  LOOP
    -- Get the original lesson details
    SELECT * INTO lesson_record FROM lessons WHERE id = recurring_group.original_lesson_id;
    
    IF lesson_record.id IS NOT NULL THEN
      working_date := recurring_group.next_extension_date::DATE;
      extension_date := working_date + INTERVAL '3 months';
      
      -- Create lessons for the next 3 months
      WHILE working_date <= extension_date LOOP
        -- Calculate days to add based on recurrence interval
        IF lesson_record.recurrence_interval = 'daily' THEN
          days_to_add := 1;
        ELSIF lesson_record.recurrence_interval = 'weekly' THEN
          days_to_add := 7;
        ELSIF lesson_record.recurrence_interval = 'biweekly' THEN
          days_to_add := 14;
        ELSIF lesson_record.recurrence_interval = 'monthly' THEN
          days_to_add := 30;
        ELSE
          days_to_add := 7; -- default to weekly
        END IF;
        
        working_date := working_date + days_to_add;
        
        -- Only create lesson if it doesn't already exist
        IF NOT EXISTS (
          SELECT 1 FROM lessons 
          WHERE DATE(start_time) = working_date 
          AND tutor_id = lesson_record.tutor_id
          AND title = lesson_record.title
        ) AND working_date <= extension_date THEN
          
          -- Create new lesson
          INSERT INTO lessons (
            title, description, tutor_id, start_time, end_time, 
            is_group, status, subject, lesson_type, is_recurring,
            recurrence_interval, recurrence_day, recurrence_end_date
          ) VALUES (
            lesson_record.title,
            lesson_record.description,
            lesson_record.tutor_id,
            working_date + (lesson_record.start_time::TIME),
            working_date + (lesson_record.end_time::TIME),
            lesson_record.is_group,
            'scheduled',
            lesson_record.subject,
            lesson_record.lesson_type,
            FALSE, -- Individual instances are not recurring
            NULL,
            NULL,
            NULL
          ) RETURNING id INTO new_lesson_id;
          
          -- Copy lesson students
          INSERT INTO lesson_students (lesson_id, student_id)
          SELECT new_lesson_id, student_id
          FROM lesson_students
          WHERE lesson_id = recurring_group.original_lesson_id;
          
        END IF;
      END LOOP;
      
      -- Update the next extension date
      UPDATE recurring_lesson_groups 
      SET next_extension_date = extension_date + INTERVAL '1 day',
          updated_at = NOW()
      WHERE id = recurring_group.id;
    END IF;
  END LOOP;
END;
$$;

-- Create function to get current week number
CREATE OR REPLACE FUNCTION get_current_week_number()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_week INTEGER;
BEGIN
  -- Calculate week number based on current date
  -- Week 1 starts in September (week 36 of the year)
  current_week := EXTRACT(week FROM NOW());
  
  -- Adjust for school year (September = week 1)
  IF current_week >= 36 THEN
    current_week := current_week - 35; -- September is week 1
  ELSE
    current_week := current_week + 17; -- January onwards
  END IF;
  
  -- Ensure we stay within 1-52 range
  IF current_week > 52 THEN
    current_week := 52;
  ELSIF current_week < 1 THEN
    current_week := 1;
  END IF;
  
  RETURN current_week;
END;
$$;

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_lesson_plans_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_lesson_plans_updated_at_trigger
  BEFORE UPDATE ON lesson_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_plans_updated_at();

CREATE TRIGGER update_recurring_groups_updated_at_trigger
  BEFORE UPDATE ON recurring_lesson_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_plans_updated_at();
