# Calendar family actions: clear buttons + on-brand forms

## Buttons (calendar header)
- "Request topic" and "Refer a friend" become clear/transparent chips with a black (foreground) outline instead of pastel sky/blush fills.
- Keep the hand-drawn doodle icons, the rounded pill shape, hover lift, and the black £100 badge on the referral chip.
- Icon circles switch from solid card fills to thin outlined circles so the whole chip reads as a clean outline button.

## Request a Topic dialog
- Rounded 1.5rem dialog surface, soft shadow, no hard borders.
- Title in Plus Jakarta heading with the doodle chat icon in a pastel chip (replacing the lucide MessageSquare).
- Labels in small semibold foreground text; subject select and topic textarea get rounded-2xl fields with muted borders and a soft focus ring (removing the current teal-outlined look).
- Footer: outlined black "Cancel" pill + solid black "Submit Request" pill, right aligned.

## Refer a Friend dialog
- Same treatment: rounded surface, doodle coin icon chip, black £100 badge next to the title.
- Name / email / phone inputs restyled as rounded-2xl pastel-tinted fields.
- Footer: outlined "Cancel" + solid black "Send Referral".

## Technical notes
- Files: `src/components/calendar/CalendarHero.tsx`, `TopicRequestDialog.tsx`, `ReferFriendDialog.tsx`.
- Styling only — form schemas, submission logic, toasts, and role handling stay unchanged.
- Use existing semantic tokens (`foreground`, `card`, `muted`, `pastel-*`, `--shadow-soft`) and `ProgressDoodles` icons; no hardcoded colours.
