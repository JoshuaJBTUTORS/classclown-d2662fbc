-- Create Testing Course with nested modules and lessons
DO $migration$
DECLARE
  test_course_id UUID;
  mod_maths_id UUID;
  mod_english_id UUID;
  mod_science_id UUID;
  mod_question_id UUID;
  mod_edge_id UUID;
BEGIN
  -- Create Testing Course
  INSERT INTO public.courses (
    title,
    description,
    subject,
    difficulty_level,
    status,
    is_free_for_all
  )
  VALUES (
    'Testing Course',
    'Internal testing course for visual features and UI changes. Do not use for students.',
    'Testing',
    'gcse',
    'published',
    true
  )
  RETURNING id INTO test_course_id;

  -- Create 5 Test Modules
  INSERT INTO public.course_modules (course_id, title, description, position) 
  VALUES (test_course_id, 'Maths Visual Tests', 'Test LaTeX rendering, exam-style questions, worked examples', 0)
  RETURNING id INTO mod_maths_id;
  
  INSERT INTO public.course_modules (course_id, title, description, position) 
  VALUES (test_course_id, 'English Visual Tests', 'Test quote analysis blocks, essay questions, text blocks', 1)
  RETURNING id INTO mod_english_id;
  
  INSERT INTO public.course_modules (course_id, title, description, position) 
  VALUES (test_course_id, 'Science Visual Tests', 'Test formulas, diagrams, mixed content', 2)
  RETURNING id INTO mod_science_id;
  
  INSERT INTO public.course_modules (course_id, title, description, position) 
  VALUES (test_course_id, 'Question Format Tests', 'Test all question types (MCQ, marks display, A/B/C/D)', 3)
  RETURNING id INTO mod_question_id;
  
  INSERT INTO public.course_modules (course_id, title, description, position) 
  VALUES (test_course_id, 'Edge Case Tests', 'Test long text, complex LaTeX, edge scenarios', 4)
  RETURNING id INTO mod_edge_id;

  -- Module 1: Maths Visual Tests (with LaTeX)
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_maths_id, 'Simple Arithmetic Test', 'Basic questions with marks display', 'text', 'This lesson tests basic arithmetic questions with the new exam-style format.', 0, true);
    
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_maths_id, 'LaTeX Heavy Test', 'Fractions, powers, roots rendering', 'text', 'This lesson tests complex LaTeX rendering including $$\dfrac{x^2 + 3x}{2x - 5}$$ and $$\sqrt{a^2 + b^2}$$', 1, true);
    
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_maths_id, 'Worked Example Test', 'Multi-step solutions with LaTeX', 'text', 'This lesson tests worked example blocks with step-by-step LaTeX.', 2, true);

  -- Module 2: English Visual Tests
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_english_id, 'Quote Analysis Test', 'Quote blocks with analysis', 'text', 'This lesson tests quote analysis blocks for English Literature.', 0, true);
    
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_english_id, 'Essay Question Test', 'Extended response questions', 'text', 'This lesson tests essay-style question formatting.', 1, true);
    
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_english_id, 'Text Block Test', 'Various text formatting', 'text', 'This lesson tests different text block styles and markdown formatting with **bold** text.', 2, true);

  -- Module 3: Science Visual Tests
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_science_id, 'Chemical Equations Test', 'Subscripts and formulas', 'text', 'This lesson tests chemical notation like H2O, CO2, and Na+.', 0, true);
    
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_science_id, 'Physics Formulas Test', 'Units and calculations', 'text', 'This lesson tests physics formulas like F = ma and E = mc^2.', 1, true);
    
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_science_id, 'Biology Content Test', 'Definitions and processes', 'text', 'This lesson tests biology content with definitions and process descriptions.', 2, true);

  -- Module 4: Question Format Tests
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_question_id, 'MCQ With Marks Test', 'Questions with [X marks] display', 'text', 'This lesson tests MCQ questions with marks badges.', 0, true);
    
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_question_id, '4-Option MCQ Test', 'A/B/C/D format', 'text', 'This lesson tests standard 4-option multiple choice questions.', 1, true);
    
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_question_id, '2-Option MCQ Test', 'True/False style', 'text', 'This lesson tests 2-option true/false style questions.', 2, true);
    
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_question_id, 'Assessment Objective Test', 'Questions with AO badges', 'text', 'This lesson tests questions with Assessment Objective badges displayed.', 3, true);

  -- Module 5: Edge Case Tests
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_edge_id, 'Long Content Test', 'Very long questions and explanations', 'text', 'This lesson tests how the UI handles very long content blocks with extensive explanations and detailed question text that spans multiple lines and paragraphs to ensure proper rendering and readability in all screen sizes.', 0, true);
    
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_edge_id, 'Complex LaTeX Test', 'Nested fractions and advanced notation', 'text', 'This lesson tests complex LaTeX like nested fractions and matrices.', 1, true);
    
  INSERT INTO public.course_lessons (module_id, title, description, content_type, content_text, position, is_preview) VALUES
    (mod_edge_id, 'Special Characters Test', 'Unicode and symbols', 'text', 'This lesson tests special characters and unicode symbols for proper rendering.', 2, true);
    
END $migration$;