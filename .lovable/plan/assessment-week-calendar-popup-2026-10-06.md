# Assessment Week calendar popup

Add an Assessment Week popup to the calendar for the current assessment week.

## Behaviour
- Show the banner to everyone who opens the calendar from Monday 5 October through Sunday 11 October 2026 at 11:59pm London time.
- Open it automatically on the calendar page, styled like the existing lesson reminder popup.
- Use this exact content:

  **Assessment Week: 5th October - 11th October**

  Please note that this week is Assessment Week across our lessons. Lessons may look a little different than usual, as we’ll be assessing students to better understand their current progress and identify the areas where they may need additional support going forward.
- Include a close action. Closing hides the popup for the current visit only; it returns after the site is reopened.
- Automatically stop showing it after the deadline, without requiring a manual removal.
- Keep the popup readable and accessible on desktop and mobile.

## Technical details
- Add the date-window check to the calendar page using the `Europe/London` timezone, so the deadline is correct regardless of the viewer’s location.
- Keep dismissal in page state only; do not store it in the browser or database.
- Reuse the existing lesson reminder popup structure, semantic colour tokens, and button components.
- Verify automatic opening and dismissal at desktop and mobile widths.
