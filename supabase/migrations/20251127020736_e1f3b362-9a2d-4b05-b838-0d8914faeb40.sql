-- Insert 15 pre-populated mock lesson plans for visual testing
-- Properly escaped JSON content to avoid SQL syntax errors

-- 1. Simple Arithmetic Test
INSERT INTO cleo_lesson_plans (lesson_id, topic, year_group, exam_board, difficulty_tier, status, learning_objectives, teaching_sequence, estimated_duration_minutes, content_block_count, difficulty_score)
VALUES (
  'cf66eb92-f01c-4bd4-afdd-b00930dd585f', 'Simple Arithmetic Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test basic MCQ format"]'::jsonb,
  '[{"id":"step1","title":"Basic Questions","duration_minutes":5,"content_blocks":[{"type":"text","data":"Testing basic arithmetic: 5 + 3 = 8"},{"type":"question","data":{"question":"What is 12 + 7?","marks":1,"options":[{"id":"a","text":"18"},{"id":"b","text":"19"},{"id":"c","text":"20"},{"id":"d","text":"21"}],"correctAnswer":"b","explanation":"12 + 7 = 19"}}]}]'::jsonb,
  15, 2, 5
),
-- 2. LaTeX Heavy Test
('2f4dc2a0-1eb3-40a4-b6cb-f1205965835e', 'LaTeX Heavy Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test LaTeX rendering"]'::jsonb,
  '[{"id":"step1","title":"Complex Math","duration_minutes":5,"content_blocks":[{"type":"text","data":"Testing fractions: $$\\dfrac{3x + 2}{5y - 1}$$ and powers: $x^{2}$ and roots: $\\sqrt{16} = 4$"}]}]'::jsonb,
  15, 1, 7
),
-- 3. Worked Example Test
('74a74ff4-30f0-4d94-9a40-7dd17e6248b8', 'Worked Example Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test worked examples"]'::jsonb,
  '[{"id":"step1","title":"Step Solution","duration_minutes":5,"content_blocks":[{"type":"worked_example","data":{"problem":"Solve $2x + 5 = 13$","steps":["Subtract 5: $2x = 8$","Divide by 2: $x = 4$"],"answer":"$x = 4$"}}]}]'::jsonb,
  15, 1, 5
),
-- 4. Quote Analysis Test
('9ebdaf8c-10eb-405a-a800-816997894c04', 'Quote Analysis Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test quote analysis"]'::jsonb,
  '[{"id":"step1","title":"Literary Quote","duration_minutes":5,"content_blocks":[{"type":"quote_analysis","data":{"quote":"It was the best of times, it was the worst of times.","analysis":"Dickens uses antithesis to create contrast."}}]}]'::jsonb,
  15, 1, 6
),
-- 5. Essay Question Test
('e49ef43d-f344-4eb7-8aca-e34c147747c7', 'Essay Question Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test essay format"]'::jsonb,
  '[{"id":"step1","title":"Extended Writing","duration_minutes":5,"content_blocks":[{"type":"question","data":{"question":"How does Shakespeare present ambition in Macbeth?","marks":30,"assessmentObjective":"AO1, AO2, AO3","options":[],"correctAnswer":"","explanation":"Consider themes and character development."}}]}]'::jsonb,
  15, 1, 8
),
-- 6. Text Block Test
('7867f599-7991-424b-9152-eaddad692969', 'Text Block Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test text formatting"]'::jsonb,
  '[{"id":"step1","title":"Text Format","duration_minutes":5,"content_blocks":[{"type":"text","data":"This tests **bold text** and normal text. Bullet points:\\n\\n• First point\\n• Second point\\n• Third point"}]}]'::jsonb,
  15, 1, 4
),
-- 7. Chemical Equations Test
('33880c9a-3a51-4a07-a5d0-ba09132aaf61', 'Chemical Equations Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test chemical formulas"]'::jsonb,
  '[{"id":"step1","title":"Chemistry","duration_minutes":5,"content_blocks":[{"type":"text","data":"Water is $H_{2}O$ and the reaction: $$2H_{2} + O_{2} \\rightarrow 2H_{2}O$$"}]}]'::jsonb,
  15, 1, 6
),
-- 8. Physics Formulas Test
('9cab4046-80cb-43c5-b1c3-a1c301ad4e8d', 'Physics Formulas Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test physics equations"]'::jsonb,
  '[{"id":"step1","title":"Force","duration_minutes":5,"content_blocks":[{"type":"text","data":"Newton Second Law: $$F = ma$$ where F is force (N)"}]}]'::jsonb,
  15, 1, 6
),
-- 9. Biology Content Test
('ea252f8c-41b0-4275-8c56-87bc4389d413', 'Biology Content Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test definition blocks"]'::jsonb,
  '[{"id":"step1","title":"Cell Biology","duration_minutes":5,"content_blocks":[{"type":"definition","data":{"term":"Photosynthesis","definition":"Process converting light to chemical energy","examples":["In chloroplasts","Requires $CO_{2}$"]}}]}]'::jsonb,
  15, 1, 5
),
-- 10. MCQ With Marks Test
('17cf5c89-c35b-4ead-ba48-a83a2c1f8d99', 'MCQ With Marks Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test marks display"]'::jsonb,
  '[{"id":"step1","title":"Marked Q","duration_minutes":5,"content_blocks":[{"type":"question","data":{"question":"Which is prime?","marks":2,"options":[{"id":"a","text":"14"},{"id":"b","text":"17"},{"id":"c","text":"18"}],"correctAnswer":"b","explanation":"17 is prime"}}]}]'::jsonb,
  15, 1, 4
),
-- 11. 4-Option MCQ Test
('495ddbca-3ae1-4621-a29e-249734989524', '4-Option MCQ Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test 4 options"]'::jsonb,
  '[{"id":"step1","title":"Four Choices","duration_minutes":5,"content_blocks":[{"type":"question","data":{"question":"What is $5 \\times 7$?","marks":1,"options":[{"id":"a","text":"32"},{"id":"b","text":"35"},{"id":"c","text":"42"},{"id":"d","text":"45"}],"correctAnswer":"b","explanation":"35"}}]}]'::jsonb,
  15, 1, 3
),
-- 12. 2-Option MCQ Test
('282cd045-2e6e-452b-97d7-f83582b069fa', '2-Option MCQ Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test true/false"]'::jsonb,
  '[{"id":"step1","title":"TrueFalse","duration_minutes":5,"content_blocks":[{"type":"question","data":{"question":"Is $\\sqrt{16} = 4$ true?","marks":1,"options":[{"id":"a","text":"True"},{"id":"b","text":"False"}],"correctAnswer":"a","explanation":"Yes"}}]}]'::jsonb,
  15, 1, 2
),
-- 13. Assessment Objective Test
('1ea29703-3c46-43b9-bb7a-bca1a633ee4d', 'Assessment Objective Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test AO display"]'::jsonb,
  '[{"id":"step1","title":"AO Display","duration_minutes":5,"content_blocks":[{"type":"question","data":{"question":"Explain osmosis in plant cells","marks":4,"assessmentObjective":"AO1, AO2","options":[],"correctAnswer":"","explanation":"Describe water movement"}}]}]'::jsonb,
  15, 1, 6
),
-- 14. Long Content Test
('3399123a-7bd6-4b51-85cc-a2faa1aba078', 'Long Content Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test scroll behavior"]'::jsonb,
  '[{"id":"step1","title":"Extended","duration_minutes":5,"content_blocks":[{"type":"text","data":"Long text block for scroll testing.\\n\\n**Section 1**\\nLorem ipsum dolor sit amet, consectetur adipiscing elit.\\n\\n**Section 2**\\nMore content here with the quadratic formula: $$x = \\dfrac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}$$"}]}]'::jsonb,
  15, 1, 5
),
-- 15. Complex LaTeX Test
('1bd97b5b-7265-47ce-94a6-d260a9861439', 'Complex LaTeX Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test nested fractions"]'::jsonb,
  '[{"id":"step1","title":"Advanced","duration_minutes":5,"content_blocks":[{"type":"text","data":"**Nested:** $$\\dfrac{1}{\\dfrac{2}{3} + \\dfrac{4}{5}}$$ and **Complex:** $$\\dfrac{x^{2} + 2x + 1}{(x-3)(x+4)}$$"}]}]'::jsonb,
  15, 1, 8
),
-- 16. Special Characters Test
('902ae29a-5e14-4036-96e0-27d38bb08cb3', 'Special Characters Test', 'GCSE Testing', 'AQA', 'higher', 'ready',
  '["Test special symbols"]'::jsonb,
  '[{"id":"step1","title":"Symbols","duration_minutes":5,"content_blocks":[{"type":"text","data":"Special chars:\\n\\n• Currency: £45.99, $30.00, €25.50\\n• Temperature: 25°C\\n• Percentages: 75%\\n• Math: ± 3, × 5, ÷ 2"}]}]'::jsonb,
  15, 1, 4
);