# Remove blue header pill on /progress

## Current state
`src/components/progress/ProgressHero.tsx` renders the page title and subtitle inside a pastel-blue banner:
- `rounded-[1.75rem] bg-pastel-sky p-6 md:p-8`
- A decorative `ScribbleStroke` accent
- Blue-tinted title/subtitle text (`text-pastel-sky-foreground`)

This is the "blue header pill" the user wants gone.

## Change
Rework `ProgressHero` so the header is plain (no blue background, no rounded pill, no pastel fill):
- Remove the `bg-pastel-sky` background, the rounded container, and the heavy padding.
- Remove the `ScribbleStroke` decoration.
- Render the title in the standard foreground color (not the pastel-sky foreground) using the existing heading font tokens.
- Keep the title, subtitle, and the `children` (the `ProgressFilters` row) in the same vertical order, just without the blue pill treatment.
- Keep the surrounding layout in `Progress.tsx` unchanged — only the hero styling changes.

No other files change. Typecheck/build to follow.
