# Calendar lesson boxes — pastel year-group colors + tick fix

## What you'll see

Lesson blocks on `/calendar` will use the ClassClown pastel design language instead of the current saturated red/orange/green/blue fills. Each year group gets one consistent pastel color everywhere it appears:

| Year group | Pastel color |
|---|---|
| KS2 | Peach/blush (soft pink) |
| KS3 | Sky blue |
| GCSE | Mint green |
| Year 11 | Butter yellow |
| A Level | Lilac purple |

Each block gets a pastel background, a matching darker text color (readable, no white-on-pastel), keeps the existing rounded corners, and the completed-lesson ✓ tick will no longer be clipped.

## Changes

### 1. `src/index.css` — pastel event styling
- Update the `.fc-event.ks2-event`, `.ks3-event`, `.gcse-event`, `.year-11-event`, `.a-level-event` rules to use the pastel tokens (`--pastel-blush`, `--pastel-sky`, `--pastel-mint`, `--pastel-butter`, `--pastel-lilac`) for background plus their `-foreground` tokens for text color.
- Also restyle `.eleven-plus-event` and `.sats-event` into the same pastel family (lilac-adjacent and blush-adjacent tints) so nothing clashes.
- Remove the global `opacity: 0.75` wash on events (scoped to `.calendar-soft`) so the pastels look clean rather than faded.
- Fix the tick: `.fc-event.completed-event::before` and `.absent-event::before` sit at `top: 2px; right: 4px` which falls inside the 14px rounded corner and gets clipped. Reposition further inside (e.g. `top: 4px; right: 8px`) and add padding so the tick/absent mark renders fully within the rounded box, and color it with the event's foreground token instead of white so it stays visible on pastel fills.

### 2. `src/utils/calendarColors.ts` — make Year 11 actually reachable
- The GCSE branch currently matches `year 11` before the Year 11 check can ever run. Move the explicit Year 11 check above the GCSE branch and remove `'year 11'` from the GCSE keyword list, so Year 11 lessons get their own color.

### 3. Verification
- Typecheck + build.
- Screenshot the `/calendar` preview to confirm pastel blocks, readable text, consistent color per year group, and an unclipped ✓ on completed lessons.

## Notes
- No changes to data, filters, or lesson dialog behavior — this is purely visual.
- Trial lessons, time-off blocks, review-room and demo sessions keep their existing distinct styling.
