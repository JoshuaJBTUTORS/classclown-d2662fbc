-- Fix foreign key constraints for voice session tables to allow CASCADE deletion

-- Update voice_session_quotas to cascade delete when user is deleted
ALTER TABLE voice_session_quotas 
  DROP CONSTRAINT IF EXISTS voice_session_quotas_user_id_fkey;

ALTER TABLE voice_session_quotas
  ADD CONSTRAINT voice_session_quotas_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Update voice_session_logs to cascade delete when user is deleted
ALTER TABLE voice_session_logs 
  DROP CONSTRAINT IF EXISTS voice_session_logs_user_id_fkey;

ALTER TABLE voice_session_logs
  ADD CONSTRAINT voice_session_logs_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Update voice_session_logs to cascade delete when quota is deleted
ALTER TABLE voice_session_logs 
  DROP CONSTRAINT IF EXISTS voice_session_logs_quota_id_fkey;

ALTER TABLE voice_session_logs
  ADD CONSTRAINT voice_session_logs_quota_id_fkey 
  FOREIGN KEY (quota_id) 
  REFERENCES voice_session_quotas(id) 
  ON DELETE CASCADE;

-- Update voice_session_logs to cascade delete when conversation is deleted
ALTER TABLE voice_session_logs 
  DROP CONSTRAINT IF EXISTS voice_session_logs_conversation_id_fkey;

ALTER TABLE voice_session_logs
  ADD CONSTRAINT voice_session_logs_conversation_id_fkey 
  FOREIGN KEY (conversation_id) 
  REFERENCES cleo_conversations(id) 
  ON DELETE CASCADE;