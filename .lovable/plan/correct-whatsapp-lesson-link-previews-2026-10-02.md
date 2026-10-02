# Correct WhatsApp lesson-link previews

The regular lesson reminder includes a link to classclowncrm.com. WhatsApp creates the preview from the linked website, not from the reminder message. The site's current public title is “Class Beyond - AI Learning Platform,” and its description mentions AI-powered tutoring; those words are in the site's static page metadata. The trial reminder instead links directly to a LessonSpace room when one exists, so that link's preview is controlled by LessonSpace.

## Change

- Replace the site's static page title, description, and matching social-preview text with accurate Class Beyond Academy tutoring wording, such as “Class Beyond Academy | Online Tutoring” and “Personalised online lessons with expert tutors.”
- Align the app's existing page-title fallback with the same wording so it doesn't revert to the AI-learning title after the page opens.
- Leave the reminder message templates and lesson links unchanged. This affects previews of links to the Class Beyond site; it cannot change previews of LessonSpace links.
- Verify the page metadata and a regular reminder link, then publish for the updated wording to appear on the live site. WhatsApp may retain an older preview until it fetches the link again.

## Technical details

Update `index.html` metadata (including Open Graph and Twitter tags) and `src/utils/domainConfig.ts`. Check the live response after publishing; client-side title changes alone are not used by WhatsApp.
