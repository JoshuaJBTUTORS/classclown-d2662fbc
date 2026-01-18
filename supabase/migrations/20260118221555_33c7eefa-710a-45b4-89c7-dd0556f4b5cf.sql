-- Propagate Meet links from parents to all instances that are missing them
UPDATE lessons child
SET 
  video_conference_link = parent.video_conference_link,
  video_conference_provider = parent.video_conference_provider,
  google_event_id = parent.google_event_id
FROM lessons parent
WHERE child.parent_lesson_id = parent.id
  AND child.is_recurring_instance = true
  AND child.status = 'scheduled'
  AND child.video_conference_link IS NULL
  AND parent.video_conference_link IS NOT NULL;