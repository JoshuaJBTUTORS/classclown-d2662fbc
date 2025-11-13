-- Add total_coins column to user_gamification_stats
ALTER TABLE user_gamification_stats 
ADD COLUMN IF NOT EXISTS total_coins integer DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_gamification_stats_coins 
ON user_gamification_stats(total_coins);

-- Backfill existing users with 0 coins
UPDATE user_gamification_stats 
SET total_coins = 0 
WHERE total_coins IS NULL;