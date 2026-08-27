# Fix: green horizontal scrollbar at the bottom of `/settings`

## Root cause (confirmed)

Two facts combine to produce the bar:

1. **The scrollbar itself is by design** — `src/index.css` styles every scrollbar globally with a deep-teal thumb (`hsl(168, 65%, 32%)`), so any scrollbar in the app renders green/teal.
2. **The horizontal overflow comes from `src/pages/Settings.tsx`**: the `<main>` element is sized with `lg:w-[calc(100vw-16rem)]`. `100vw` includes the width of the vertical scrollbar (~15px on non-overlay scrollbars), so `sidebar (16rem) + main (100vw − 16rem)` totals more than the actual visible width. The page overflows horizontally by the scrollbar's width, and the themed green horizontal scrollbar appears at the bottom.

Only `Settings.tsx` uses this `100vw` calc pattern — no other page is affected (verified by search).

## Fix

In `src/pages/Settings.tsx`, stop sizing `<main>` from the viewport and let flexbox distribute the space instead:

- Replace `min-w-0 w-full max-w-none lg:w-[calc(100vw-16rem)] lg:flex-none` with `min-w-0 flex-1` — the sidebar keeps its fixed 16rem, and `<main>` simply fills whatever width remains, so nothing can overflow regardless of scrollbar width.

## Verify

- Load `/settings` at the user's viewport (1645px) with classic scrollbars forced on and confirm no horizontal scrollbar appears and the content still spans the full width beside the sidebar.
- Spot-check one other sidebar page (e.g. `/calendar`) to confirm no regression from the shared layout (none expected — the change is local to Settings).

## Not changing

- The global teal scrollbar styling in `index.css` (it's the intended design; only the overflow triggering it is a bug).
