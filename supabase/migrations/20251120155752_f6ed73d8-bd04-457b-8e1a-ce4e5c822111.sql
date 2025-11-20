-- Add session_stage column to cleo_conversations for multi-turn introduction flow
ALTER TABLE cleo_conversations 
ADD COLUMN session_stage TEXT DEFAULT 'mic_check' 
CHECK (session_stage IN ('mic_check', 'paper_check', 'prior_knowledge', 'lesson_intro', 'teaching', 'completed'));

-- Add index for performance
CREATE INDEX idx_cleo_conversations_session_stage ON cleo_conversations(session_stage);

-- Add comment for documentation
COMMENT ON COLUMN cleo_conversations.session_stage IS 'Current stage of the lesson introduction flow: mic_check -> paper_check -> prior_knowledge -> lesson_intro -> teaching -> completed';