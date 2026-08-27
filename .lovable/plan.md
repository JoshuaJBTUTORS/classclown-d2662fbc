# Settings: true full-width layout + custom hand-drawn icons

## 1. Use the full page width

Right now each accordion section stacks its content in one narrow column, so on a wide screen everything hugs the left and the right half is empty. Fix by giving each section a real multi-column layout:

- **Page shell**: keep full-bleed padding, add a wider max width only at very large screens (`2xl`) so text lines never get uncomfortably long, but let the sections fill the space up to that point.
- **Profile Information**: two-column field grid on `lg` (First/Last on row one, Email/Phone on row two), submit button aligned right on the same row-width as the grid instead of full-bleed.
- **Security**: two-column grid — current password + new password on the left column, confirm + requirements/tips panel on the right, so the section fills the width instead of a tall thin stack.
- **Profile Icon**: current icon preview on the left, the initials + four Cleo avatar choices laid out in a horizontal row to the right (wraps on small screens).
- **Account Information**: already a 4-up grid — keep it, it becomes the visual reference for the other sections' density.
- Inputs stop being `w-full` inside a 1600px column; they sit in the grid cells so nothing looks stretched.

## 2. Replace the generic icons

Drop the stock lucide glyphs in pastel circles (smile / user / shield / cog / server) — they read as generic. Replace with a small set of hand-drawn doodle SVGs in the ClassClown ink style (same 2px rounded stroke language as `ScribbleStroke`):

- Profile Icon — a sketched smiley badge
- Profile — a sketched person outline with a hand-drawn underline
- Security — a sketched padlock
- Account Information — a sketched ID card
- System — a sketched stacked-server/toggle doodle

Each drawn as an inline SVG component so it inherits `currentColor` and keeps the pastel chip tint. Chips also become slightly squircle/rotated rather than perfect circles, to match the hand-made feel of the rest of the app.

## Technical notes

- New `src/components/settings/DoodleIcons.tsx` exporting the five inline SVG icon components (stroke-based, `currentColor`, `strokeLinecap="round"`).
- `src/pages/Settings.tsx`: swap lucide imports for the doodle icons; widen container (`w-full ... 2xl:max-w-[1600px]`).
- `src/components/settings/SettingsSection.tsx`: chip becomes `rounded-[1rem] rotate-[-3deg]`, icon sized 20px.
- `src/components/settings/ProfileSettings.tsx`, `SecuritySettings.tsx`, `ProfileIconSettings.tsx`: layout-only grid changes; no form logic, validation, or Supabase calls touched.
