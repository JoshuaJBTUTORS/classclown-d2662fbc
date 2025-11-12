-- Add model tracking to cleo_conversations
ALTER TABLE cleo_conversations 
ADD COLUMN IF NOT EXISTS current_model TEXT DEFAULT 'mini',
ADD COLUMN IF NOT EXISTS mini_seconds_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS full_seconds_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS model_switches INTEGER DEFAULT 0;

-- Add model tracking to cleo_messages
ALTER TABLE cleo_messages 
ADD COLUMN IF NOT EXISTS model_used TEXT DEFAULT 'mini';

-- Add cost tracking to voice_session_logs
ALTER TABLE voice_session_logs
ADD COLUMN IF NOT EXISTS mini_seconds_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS full_seconds_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_cost_gbp DECIMAL(10, 4) DEFAULT 0;

-- Create index for faster conversation queries
CREATE INDEX IF NOT EXISTS idx_cleo_messages_conversation_created 
ON cleo_messages(conversation_id, created_at DESC);