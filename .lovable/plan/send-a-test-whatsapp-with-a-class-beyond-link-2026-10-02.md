# Send a test WhatsApp with a Class Beyond link

## Goal
Check what the link preview looks like on WhatsApp now that the site wording reads "Class Beyond Academy | Online Tutoring".

## Steps
1. Confirm the new wording is live on classclowncrm.com. If the live site still shows the old AI title, the site needs publishing first, or the test will show the old preview.
2. Send one WhatsApp test message to your number (+447413069120) only. It uses the regular lesson reminder wording with a classclowncrm.com link. No parents or students receive anything.
3. Check that it was delivered and report the result.

## Notes
- WhatsApp may keep showing an old preview for a link it has seen before. The test link gets a harmless extra tag so WhatsApp loads the preview again.
- LessonSpace room links in trial reminders still show LessonSpace's own preview.

## Technical details
Fetch the live HTML and check the og:title. Send through the existing Wazzup service with a cache-busting query string (e.g. `?v=<timestamp>`).
