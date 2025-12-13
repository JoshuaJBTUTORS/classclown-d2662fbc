-- Fix Q1: Add LaTeX formatting
UPDATE assessment_questions 
SET question_text = 'Calculate the value of $3^2 + 4^2$ using the principles of BIDMAS.'
WHERE id = '5ca3bce3-7aaf-447b-a273-342689bbb3a3';

-- Fix Q2: Add LaTeX formatting
UPDATE assessment_questions 
SET question_text = 'Simplify the following algebraic expression: $5x + 3x - 2x$'
WHERE id = '9aab9afd-b01a-49a9-bf2c-6dd3f9fd2d30';

-- Fix Q3: Add LaTeX formatting  
UPDATE assessment_questions 
SET question_text = 'Solve the equation $2(x - 3) = 4x + 6$'
WHERE id = '2f9b6b35-25e5-4e09-b92b-7e87d0fc6885';