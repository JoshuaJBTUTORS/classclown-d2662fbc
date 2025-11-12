-- Add 10 bonus voice session credits to britney@classclown.io
UPDATE voice_session_quotas
SET bonus_sessions = bonus_sessions + 10
WHERE user_id = '54ea0b01-d8dc-4980-b5a9-dfd12e5efc31';