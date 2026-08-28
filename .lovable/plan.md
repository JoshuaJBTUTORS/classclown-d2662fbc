# Calendar event boxes: richer color + tiger stripes

## Goal
Calendar lesson boxes currently look washed out. Make each year-group color bolder and add a subtle diagonal "tiger stripe" texture to the boxes, keeping text readable.

## Changes

### 1. Stronger event colors — `src/index.css`
The event rules currently use the very light pastel surface tokens (90-94% lightness), which read as faded. Replace them with deeper, saturated variants per group (new `--event-*` tokens), e.g.:

- KS2: blush → `344 60% 80%`
- KS3: sky → `205 70% 78%`
- GCSE: mint → `158 45% 72%`
- Year 11: butter → `44 85% 72%`
- A Level: lilac → `265 50% 80%`
- 11 Plus / SATS: softer variants of lilac/blush

Text keeps the existing dark foreground tokens for contrast. Dark mode gets matching richer tokens.

### 2. Tiger stripe texture — `src/index.css`
Add a `repeating-linear-gradient` (45° diagonal stripes, ~10px period) layered over each event background using the group's foreground color at ~6-8% opacity:

```css
.calendar-soft .fc-event {
  background-image: repeating-linear-gradient(
    45deg,
    hsl(var(--event-stripe) / 0.08) 0 6px,
    transparent 6px 12px
  ) !important;
}
```

`--event-stripe` is set per year-group class (`.ks2-event`, `.ks3-event`, `.gcse-event`, `.year-11-event`, `.a-level-event`, etc.) to that group's foreground color, so stripes tone-match each box. Stripes stay subtle so titles remain legible.

### 3. Verify
- Typecheck/build passes.
- Visual check of `/calendar` (needs signed-in preview; if unavailable, note it).

## Notes
- No changes to event mapping logic (`calendarColors.ts` already fixed for Year 11).
- Completion ✓ / absent ✖ marks stay inside rounded corners and now inherit the darker text color, remaining visible over stripes.
