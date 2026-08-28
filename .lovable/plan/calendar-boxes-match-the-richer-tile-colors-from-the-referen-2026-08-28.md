# Calendar boxes: match the richer tile colors from the reference

## Goal
Event boxes still read faded next to the reference tiles (image 2: solid sky-blue, warm sand, and butter tiles with bold dark text). Deepen the calendar event colors to that richness while keeping the per-year-group mapping and tiger stripes.

## Changes — `src/index.css` only

### 1. Deepen the `--event-*` tokens to match the reference tiles
- KS2: blush → `344 65% 78%` (solid pink like the KS2 tile)
- KS3: sky → `206 72% 76%` (the strong blue of the "GCSE Maths Group" tile)
- GCSE: mint → `158 42% 68%` (deeper green)
- Year 11: butter → `44 88% 74%` (the warm yellow tile)
- A Level / 11 Plus: lilac → `265 48% 78%`
- SATS: sand → `28 50% 80%` (the warm sand tile)

Dark-mode tokens deepened to match.

### 2. Strengthen legibility + stripes
- Bump stripe opacity from 0.08 to ~0.10 so the tiger-stripe texture reads at small sizes.
- Make event title text slightly bolder (`font-weight: 600`) within `.calendar-soft .fc-event .fc-event-title` so titles pop like the reference tiles.

### 3. Verify
- Build passes; note that signed-in visual check isn't available from the sandbox.

## No changes to
- Year-group mapping logic, event layout, ✓/✖ marks, or any component code.
