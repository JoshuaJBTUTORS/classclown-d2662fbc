# /auth Redesign

Purely visual restyle of the sign-in page to match the ClassClown design language, using the attached split-card layout as the structural reference. No auth logic, routes, or validation changes.

## Layout (from the inspo image)

- Full-screen soft pastel backdrop with a large rounded "device" panel centred on the page.
- Inside that panel: two columns.
  - **Left**: compact sign-in card — "Welcome back" heading, subtitle, Email field, Password field with show/hide eye, "Forgot password?" link on the right, full-width black pill Sign In button.
  - **Right**: a rounded showcase panel with blurred pastel colour blobs and the Cleo mascot artwork floating in the centre (replacing the astronaut).
- Mobile: right showcase panel hides, the sign-in card takes full width and stays centred.

## Styling

- Backdrop: layered soft pastel gradient blobs (mint / lilac / blush / sky tokens) at low opacity instead of the current blue-purple gradient.
- Heading in Plus Jakarta Sans (`font-heading`), body in Inter; "Welcome back" large and bold, muted caption below.
- Inputs: tall, rounded (1rem), subtle border, soft focus ring; labels small and muted above each field.
- Primary button: black pill, full width, white label — matching the inspo.
- Card: white surface, 1.5rem radius, soft shadow, faint border.
- Subtle `ScribbleStroke` accent at low opacity behind the heading.

## Also restyled to match

- `ForgotPasswordForm` and `ResetPasswordForm` shown on the same route — same card shell, pill buttons, rounded inputs, no `text-gray-*`/`text-green-600` hardcoded colours.

## Technical notes

- Files: `src/pages/Auth.tsx` (main), `src/components/auth/ForgotPasswordForm.tsx`, `src/components/auth/ResetPasswordForm.tsx`.
- Reuse `ScribbleStroke` from `src/components/lessonPlans/ScribbleStroke.tsx` and the existing `pastel-*` Tailwind tokens; no hardcoded hex or grey utility colours.
- Mascot art: existing `src/assets/cleo-logo.png` / Cleo avatars in `src/assets/avatars`.
- Keep `signIn`, `sanitizeInput`, `validateEmail`, the reset-password tab check, the `DomainSEO` tag, and the redirect-on-user effect exactly as they are.
- The feature bullet list currently on the left ("Interactive Voice Lessons" etc.) is dropped in favour of the showcase panel.
