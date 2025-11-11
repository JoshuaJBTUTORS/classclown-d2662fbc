-- Add 10 bonus voice session credits to britney@classclown.io
-- User ID: 54ea0b01-d8dc-4980-b5a9-dfd12e5efc31

UPDATE voice_session_quotas
SET bonus_sessions = bonus_sessions + 10
WHERE id = '896361d9-c4b1-48b7-bea4-653759ac7f14';

-- Verification: Check the updated quota
-- Expected result: bonus_sessions should now be 13 (was 3, added 10)