# Assessment Week calendar banner

Add a prominent Assessment Week notice to the calendar for the current assessment week.

## Behaviour
- Show the banner to everyone who opens the calendar from Monday 5 October through Sunday 11 October 2026 at 11:59pm London time.
- Place it directly below the “Cleo Calendar” heading so it appears above both calendar views.
- Use the existing ClassClown pastel design language with a clear assessment icon and this exact content:

  **Assessment Week: 5th October - 11th October**

  Please note that this week is Assessment Week across our lessons. Lessons may look a little different than usual, as we’ll be assessing students to better understand their current progress and identify the areas where they may need additional support going forward.
- Include a close button. Closing hides the banner for the current visit only; it returns after the site is reopened.
- Automatically stop showing it after the deadline, without requiring a manual removal.
- Keep the banner readable and accessible on desktop and mobile.

## Technical details
- Add the date-window check to the calendar page using the `Europe/London` timezone, so the deadline is correct regardless of the viewer’s location.
- Keep dismissal in page state only; do not store it in the browser or database.
- Reuse the project’s semantic colour tokens and existing icon/button components.
- Verify the calendar layout and dismissal behaviour at desktop and mobile widths.
