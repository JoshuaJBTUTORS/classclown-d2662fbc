## Change
Replace the intro video in the proposal page with the Descript video: https://share.descript.com/view/FyFnjajOdYE

## Implementation
In `src/components/proposals/ProposalLayout.tsx`:
- Update `INTRO_VIDEO_URL` (line 9) to `https://share.descript.com/embed/FyFnjajOdYE` (Descript's standard embed URL for a `/view/{id}` share link).
- Keep the existing `<iframe>` markup, aspect-video wrapper, and allow attributes — Descript embeds work in a standard iframe with `allow="fullscreen; autoplay; clipboard-write"`. I'll update the `allow` attribute accordingly.

No other files or logic change.