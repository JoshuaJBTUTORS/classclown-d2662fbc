# Plan: Remove background from the yellow Cleo hand logo

## Goal
The waving yellow hand shown on slide 1 of the `/auth` showcase (`src/components/auth/AuthShowcase.tsx`) currently sits on a solid background. Make it a transparent PNG so only the hand is visible.

## Approach
1. **Edit the existing asset** with `imagegen--edit_image`, passing the current `cleo-hand.png` CDN URL as the source image, `prompt: "Remove the background, keeping only the yellow waving hand. Place the hand on a solid white background."`, `transparent_background: true`, output to `/tmp/cleo-hand-transparent.png`.
   - `imagegen--edit_image` handles the white-background-then-remove pipeline automatically when `transparent_background` is set.
2. **Re-upload** the transparent PNG via `lovable-assets create --file /tmp/cleo-hand-transparent.png --filename cleo-hand.png`, writing the new `.asset.json` pointer over `src/assets/auth/cleo-hand.png.asset.json`.
3. **Delete the old asset** pointer/CDN object to avoid orphans (the `lovable-assets delete` step is folded into replacing the pointer; the old CDN object remains but is unreferenced — acceptable, or optionally delete first).
4. **No code change needed** — `AuthShowcase.tsx` already imports the asset by URL, so swapping the pointer file is sufficient. Verify the rendered `/auth` slide shows the hand with no surrounding background.

## Files touched
- `src/assets/auth/cleo-hand.png.asset.json` (replaced pointer)
- `/tmp/cleo-hand-transparent.png` (intermediate, ephemeral)

## Verification
- Open `/auth` in the preview, confirm slide 1 shows the yellow hand with transparent background (no white/colored box around it).
- Check build logs for errors.
