UPDATE voice_session_quotas 
SET bonus_minutes = bonus_minutes + 15,
    total_minutes_allowed = total_minutes_allowed + 15
WHERE id = '85add7fd-32fb-4d79-8d78-3ab009a75470';