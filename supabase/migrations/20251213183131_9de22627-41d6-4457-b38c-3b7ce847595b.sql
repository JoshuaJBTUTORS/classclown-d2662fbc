-- Add extract columns to ai_assessments for English Language papers
ALTER TABLE ai_assessments ADD COLUMN IF NOT EXISTS extract_text TEXT;
ALTER TABLE ai_assessments ADD COLUMN IF NOT EXISTS extract_source VARCHAR(255);
ALTER TABLE ai_assessments ADD COLUMN IF NOT EXISTS extract_type VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN ai_assessments.extract_text IS 'Source text/extract for English Language assessments that questions are based on';
COMMENT ON COLUMN ai_assessments.extract_source IS 'Attribution for the extract, e.g., Adapted from Great Expectations by Charles Dickens';
COMMENT ON COLUMN ai_assessments.extract_type IS 'Type of extract: fiction, non-fiction, 19th-century, 21st-century';