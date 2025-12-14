-- Fix LaTeX formatting in existing assessment questions for Maths, Physics, Chemistry

CREATE OR REPLACE FUNCTION fix_latex_formatting(input_text TEXT) RETURNS TEXT AS $$
DECLARE
  result TEXT := input_text;
BEGIN
  IF result IS NULL OR result = '' THEN
    RETURN result;
  END IF;
  
  -- Convert Unicode superscripts to LaTeX
  result := regexp_replace(result, '([a-zA-Z0-9])²', E'$\\1^2$', 'g');
  result := regexp_replace(result, '([a-zA-Z0-9])³', E'$\\1^3$', 'g');
  result := regexp_replace(result, '²', '^2', 'g');
  result := regexp_replace(result, '³', '^3', 'g');
  
  -- Convert standalone caret expressions like x^2 to wrapped LaTeX
  result := regexp_replace(result, '(?<!\$)([a-zA-Z])(\^)([0-9]+)(?!\$)', E'$\\1\\2\\3$', 'g');
  result := regexp_replace(result, '(?<!\$)([0-9]+)(\^)([0-9]+)(?!\$)', E'$\\1\\2\\3$', 'g');
  
  -- Convert multiplication symbol
  result := regexp_replace(result, '([0-9]+)\s*×\s*([0-9]+)', E'$\\1 \\\\times \\2$', 'g');
  
  -- Convert division symbol
  result := regexp_replace(result, '([0-9]+)\s*÷\s*([0-9]+)', E'$\\1 \\\\div \\2$', 'g');
  
  -- Clean up any double dollar signs created by our replacements
  result := regexp_replace(result, '\$\$', '$', 'g');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

UPDATE assessment_questions
SET 
  question_text = fix_latex_formatting(question_text),
  correct_answer = fix_latex_formatting(correct_answer)
WHERE assessment_id IN (
  SELECT id FROM ai_assessments 
  WHERE subject ILIKE '%maths%' 
     OR subject ILIKE '%physics%' 
     OR subject ILIKE '%chemistry%'
);

DROP FUNCTION fix_latex_formatting(TEXT);