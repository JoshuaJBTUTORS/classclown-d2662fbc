-- Add voice_speed column to profiles table for live voice speed control
ALTER TABLE profiles 
ADD COLUMN voice_speed DECIMAL(3,2) DEFAULT 0.80 
CHECK (voice_speed >= 0.60 AND voice_speed <= 1.20);

COMMENT ON COLUMN profiles.voice_speed IS 'User preferred voice speed for Cleo (0.60-1.20, default 0.80)';