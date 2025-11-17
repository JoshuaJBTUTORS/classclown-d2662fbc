
-- Rebuild GCSE English lesson plans to match GCSE English Language course structure
-- This ensures exact topic matching for pre-lesson prep

-- Step 1: Delete existing GCSE English lesson plans
DELETE FROM lesson_plans WHERE subject = 'GCSE English';

-- Step 2: Insert 52 new lesson plans mapped to the 26 course lessons

-- FIRST CYCLE (Weeks 1-26): Initial teaching
-- Fiction Reading Module (Weeks 1-5) - Autumn Term
INSERT INTO lesson_plans (subject, topic_title, week_number, term, description) VALUES
('GCSE English', 'Understanding Fiction Extracts', 1, 'Autumn', 'Learn to analyse fiction texts, identify key features, and understand narrative techniques.'),
('GCSE English', 'Analysing Language', 2, 'Autumn', 'Explore how writers use language choices to create meaning and effect in fiction texts.'),
('GCSE English', 'Analysing Structure', 3, 'Autumn', 'Examine structural features and their impact on the reader in fiction writing.'),
('GCSE English', 'Evaluating a Writer''s Methods', 4, 'Autumn', 'Assess and evaluate the effectiveness of a writer''s techniques and choices.'),
('GCSE English', 'Developing Interpretations and Inference', 5, 'Autumn', 'Build skills in reading between the lines and developing supported interpretations.');

-- Creative Writing Module (Weeks 6-11) - Autumn Term
INSERT INTO lesson_plans (subject, topic_title, week_number, term, description) VALUES
('GCSE English', 'Writing Descriptively (Imagery and Setting)', 6, 'Autumn', 'Master descriptive writing techniques using imagery and vivid setting descriptions.'),
('GCSE English', 'Characterisation and Dialogue', 7, 'Autumn', 'Create compelling characters and write natural, purposeful dialogue.'),
('GCSE English', 'Narrative Structure and Plot Development', 8, 'Autumn', 'Understand story structure and develop engaging narrative plots.'),
('GCSE English', 'Using Figurative Language', 9, 'Autumn', 'Employ metaphors, similes, and other figurative devices effectively in creative writing.'),
('GCSE English', 'Crafting Openings and Endings', 10, 'Autumn', 'Write powerful story openings that hook readers and satisfying endings.'),
('GCSE English', 'Writing from a Stimulus (Image or Title)', 11, 'Autumn', 'Respond creatively to visual or textual prompts in timed conditions.');

-- Non-Fiction Reading Module (Weeks 12-16) - Autumn/Spring Term
INSERT INTO lesson_plans (subject, topic_title, week_number, term, description) VALUES
('GCSE English', 'Analysing Non-Fiction Extracts', 12, 'Autumn', 'Analyse non-fiction texts, identifying purposes, audiences, and techniques.'),
('GCSE English', 'Comparing Writers'' Viewpoints and Perspectives', 13, 'Autumn', 'Compare how different writers express their viewpoints and perspectives.'),
('GCSE English', 'Analysing Persuasive and Rhetorical Techniques', 14, 'Autumn', 'Identify and analyse rhetorical devices and persuasive methods in texts.'),
('GCSE English', 'Understanding Tone and Bias', 15, 'Autumn', 'Recognize tone, bias, and how writers position readers through language.'),
('GCSE English', 'Comparing Methods Across Texts', 16, 'Autumn', 'Compare methods and techniques used by different writers across multiple texts.');

-- Non-Fiction Writing Module (Weeks 17-21) - Spring Term
INSERT INTO lesson_plans (subject, topic_title, week_number, term, description) VALUES
('GCSE English', 'Writing to Argue and Persuade', 17, 'Spring', 'Construct convincing arguments and persuasive texts for specific purposes.'),
('GCSE English', 'Writing to Inform and Explain', 18, 'Spring', 'Write clear, informative texts that explain complex ideas effectively.'),
('GCSE English', 'Structuring Argumentative Writing', 19, 'Spring', 'Organize and structure arguments logically for maximum impact.'),
('GCSE English', 'Using Rhetorical Devices Effectively', 20, 'Spring', 'Deploy rhetorical techniques strategically in your own non-fiction writing.'),
('GCSE English', 'Adapting Tone, Form, and Register', 21, 'Spring', 'Adjust tone, form, and register appropriately for different audiences and purposes.');

-- Spoken Language Module (Weeks 22-26) - Spring Term
INSERT INTO lesson_plans (subject, topic_title, week_number, term, description) VALUES
('GCSE English', 'Planning a Speech or Presentation', 22, 'Spring', 'Plan and structure effective spoken language presentations and speeches.'),
('GCSE English', 'Organising Ideas Logically', 23, 'Spring', 'Sequence and organize spoken content for clarity and coherence.'),
('GCSE English', 'Using Voice, Tone, and Body Language', 24, 'Spring', 'Employ vocal variety, tone, and non-verbal communication effectively.'),
('GCSE English', 'Engaging the Audience', 25, 'Spring', 'Use techniques to capture and maintain audience attention during presentations.'),
('GCSE English', 'Responding to Questions and Feedback', 26, 'Spring', 'Handle questions and feedback confidently and constructively.');

-- SECOND CYCLE (Weeks 27-48): Revision and deepening
-- Fiction Reading Module (Weeks 27-31) - Spring/Summer Term
INSERT INTO lesson_plans (subject, topic_title, week_number, term, description) VALUES
('GCSE English', 'Understanding Fiction Extracts', 27, 'Spring', 'Revisit fiction analysis with more complex texts and deeper analysis.'),
('GCSE English', 'Analysing Language', 28, 'Spring', 'Deepen language analysis skills with sophisticated vocabulary and techniques.'),
('GCSE English', 'Analysing Structure', 29, 'Spring', 'Advanced structural analysis and understanding of narrative frameworks.'),
('GCSE English', 'Evaluating a Writer''s Methods', 30, 'Spring', 'Refine evaluation skills with nuanced critical commentary.'),
('GCSE English', 'Developing Interpretations and Inference', 31, 'Spring', 'Advanced inference skills and developing alternative interpretations.');

-- Creative Writing Module (Weeks 32-37) - Summer Term
INSERT INTO lesson_plans (subject, topic_title, week_number, term, description) VALUES
('GCSE English', 'Writing Descriptively (Imagery and Setting)', 32, 'Summer', 'Refine descriptive writing with sophisticated imagery and atmospheric settings.'),
('GCSE English', 'Characterisation and Dialogue', 33, 'Summer', 'Create multi-layered characters and subtext-rich dialogue.'),
('GCSE English', 'Narrative Structure and Plot Development', 34, 'Summer', 'Master complex narrative structures and plot techniques.'),
('GCSE English', 'Using Figurative Language', 35, 'Summer', 'Employ advanced figurative language with precision and originality.'),
('GCSE English', 'Crafting Openings and Endings', 36, 'Summer', 'Perfect impactful openings and memorable, resonant endings.'),
('GCSE English', 'Writing from a Stimulus (Image or Title)', 37, 'Summer', 'Advanced stimulus response with sophisticated interpretation and technique.');

-- Non-Fiction Reading Module (Weeks 38-42) - Summer Term
INSERT INTO lesson_plans (subject, topic_title, week_number, term, description) VALUES
('GCSE English', 'Analysing Non-Fiction Extracts', 38, 'Summer', 'Advanced non-fiction analysis with complex contemporary texts.'),
('GCSE English', 'Comparing Writers'' Viewpoints and Perspectives', 39, 'Summer', 'Sophisticated comparison of contrasting viewpoints and perspectives.'),
('GCSE English', 'Analysing Persuasive and Rhetorical Techniques', 40, 'Summer', 'Advanced rhetorical analysis with subtle and sophisticated techniques.'),
('GCSE English', 'Understanding Tone and Bias', 41, 'Summer', 'Nuanced understanding of implicit tone and sophisticated bias techniques.'),
('GCSE English', 'Comparing Methods Across Texts', 42, 'Summer', 'Advanced comparative analysis with synthesis of multiple perspectives.');

-- Non-Fiction Writing Module (Weeks 43-47) - Summer Term
INSERT INTO lesson_plans (subject, topic_title, week_number, term, description) VALUES
('GCSE English', 'Writing to Argue and Persuade', 43, 'Summer', 'Advanced persuasive writing with sophisticated arguments and counter-arguments.'),
('GCSE English', 'Writing to Inform and Explain', 44, 'Summer', 'Expert informative writing with clarity, precision, and engagement.'),
('GCSE English', 'Structuring Argumentative Writing', 45, 'Summer', 'Master sophisticated argument structures and logical progression.'),
('GCSE English', 'Using Rhetorical Devices Effectively', 46, 'Summer', 'Deploy complex rhetorical patterns with subtlety and impact.'),
('GCSE English', 'Adapting Tone, Form, and Register', 47, 'Summer', 'Expert control of tone, form, and register for diverse audiences.');

-- Spoken Language Module (Week 48) - Summer Term
INSERT INTO lesson_plans (subject, topic_title, week_number, term, description) VALUES
('GCSE English', 'Planning a Speech or Presentation', 48, 'Summer', 'Final refinement of spoken language presentation skills.');

-- EXAM PREPARATION (Weeks 49-52) - Summer Term
INSERT INTO lesson_plans (subject, topic_title, week_number, term, description) VALUES
('GCSE English', 'Mock Exam Week - Full Papers', 49, 'Summer', 'Complete mock examinations under timed conditions for both papers.'),
('GCSE English', 'Detailed Feedback and Action Planning', 50, 'Summer', 'Comprehensive feedback analysis and personalized revision strategies.'),
('GCSE English', 'Final Practice - Exam Technique Focus', 51, 'Summer', 'Targeted practice on exam technique, timing, and question interpretation.'),
('GCSE English', 'Final Confidence Building and Review', 52, 'Summer', 'Final review of key skills, confidence building, and exam day preparation.');
