-- Add 10 bonus sessions to britney@classclown.io
UPDATE voice_session_quotas
SET bonus_sessions = bonus_sessions + 10
WHERE id = '896361d9-c4b1-48b7-bea4-653759ac7f14';