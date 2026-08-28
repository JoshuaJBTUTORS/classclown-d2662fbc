# Make /auth a full-bleed white page

## Goal
The login page currently renders as a centered rounded card (`max-w-6xl`, border, shadow, `backdrop-blur`) floating on a tinted background. The user wants the pure white background to fill the **entire page** instead of being contained inside that box.

## Changes (single file: `src/pages/Auth.tsx`)

1. **Outer container** — drop `flex items-center justify-center p-4 sm:p-8`; make it `min-h-screen` full-bleed white (`bg-background`) with no centering padding.
2. **Remove the card wrapper** — remove the `motion.div` card styling: `max-w-6xl`, `rounded-[2rem]`, `border`, `bg-card/80`, `backdrop-blur-xl`, `shadow-...`, and its `p-4 sm:p-8` padding. Keep the entrance animation on a plain full-width/height wrapper instead.
3. **Two-column grid** — let the existing `grid lg:grid-cols-2` fill the full viewport height (`min-h-screen`, `h-screen`), with the login form column and the showcase panel each taking half the screen edge-to-edge.
4. **Showcase panel** — keep it as the right-half surface; remove its own inner `rounded-[1.75rem] border` since it now spans the full right half of the page (keep `overflow-hidden`).
5. **Remove outer PastelBlobs** on the page background (the card was what made them read as a contained panel). Keep the showcase panel's own pastel blobs.

## What stays the same
- Login form content, fields, button, forgot-password flow.
- AuthShowcase carousel (Cleo hand / whiteboard / results slides).
- All auth logic (`signIn`, reset-password, forgot-password).
