# Calendar: restyle "Request topic" and "Refer a friend £100"

Bring the two family action buttons on the Cleo Calendar header in line with the ClassClown design language (pastel surfaces, soft rounded shapes, hand-drawn black doodle icons, no generic Lucide glyphs).

## What changes

**Header actions (`src/components/calendar/CalendarHero.tsx`)**
- Replace the two flat grey pills with pastel action chips:
  - Request topic — soft blue pastel surface, black hand-drawn chat/speech doodle in a rounded white icon chip.
  - Refer a friend — soft peach pastel surface, black hand-drawn coin doodle, with "£100" rendered as a small dark badge pill rather than plain inline text.
- Keep the same rounded-full geometry, 44px height, soft shadow, lift-on-hover, and focus ring already used by the other calendar pills so the row stays visually consistent.
- Preserve existing props, click handlers, and the `showFamilyActions` gating exactly as-is.
- Mobile: chips wrap and shrink gracefully (icon + label stay legible, no overflow).

**Doodle icons (`src/components/progress/ProgressDoodles.tsx`)**
- Reuse the existing `DoodleChat` and `DoodleCoin` hand-drawn icons already built for the referral section on `/progress`, so calendar and progress share one icon vocabulary. No new icon files.

**Dialogs**
- The Refer a friend dialog keeps its current behaviour; only its header gets the matching doodle icon chip and pastel title treatment so opening it feels continuous with the button. No form, validation, or submission logic changes.

## Technical notes

- Colours come from existing semantic tokens in `src/index.css` (pastel/progress tokens added for the progress redesign); no hardcoded hex or `bg-blue-*` utilities.
- `Users` and `MessageSquare` imports from lucide-react are dropped from `CalendarHero.tsx`.
- Purely presentational: no data fetching, permissions, or referral logic touched.
