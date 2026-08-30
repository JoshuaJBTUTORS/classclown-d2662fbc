# Recolour /refer hero to soft blue + black

## Goal
Swap the green/yellow/pink pastels and teal accent in the `/refer` hero (top section + gift illustration) for a **soft blue (`pastel-sky`) + black** palette, matching the rest of the ClassClown language but leaning blue/monochrome instead of green/yellow. Copy, layout, and functionality stay identical — this is a colour-only change.

## Scope (2 files)
- `src/pages/ReferFriend.tsx` — hero `<section>` + `STEPS` disc/badge colours
- `src/components/referral/GiftIllustration.tsx` — glow, floating chips, sticker card

## Changes

### `ReferFriend.tsx`
- Hero section background: `bg-pastel-mint` → `bg-pastel-sky`
- Glow blobs: `bg-pastel-butter/70` and `bg-pastel-blush/60` → two soft-blue tints (`bg-pastel-sky/70`, `bg-pastel-sky/50`)
- "Refer a friend" badge coin disc: `bg-pastel-butter` → `bg-pastel-sky`
- "get £50" emphasis: `text-primary` → `text-foreground` (black); squiggle `text-primary` → `text-foreground`
- `STEPS` array disc/badge colours: replace `bg-pastel-blush`, `bg-pastel-butter` with `bg-pastel-sky` and a neutral/black variant so the three steps read as blue → blue-deep → black (keep `bg-pastel-sky` on step 3, others use light sky tints / `bg-foreground/5`)

### `GiftIllustration.tsx`
- Glow: `bg-pastel-butter/80` → `bg-pastel-sky/80`
- Floating chips: replace `bg-pastel-blush`, `bg-pastel-butter`, `bg-pastel-mint` with `bg-pastel-sky` and `bg-background`/black-tinted variants (keep one `bg-pastel-sky` for a hint of blue)
- Sticker card "£50": `text-primary` → `text-foreground` (black)
- Tape strip: `bg-pastel-butter/90` → `bg-pastel-sky/90`
- Bottom dots: replace `bg-pastel-blush`, `bg-pastel-butter`, `bg-pastel-sky` → three `bg-pastel-sky` opacity variants (or sky + two black-tints)

## Out of scope
- No layout/structure changes, no copy changes, no logic/behaviour changes
- ShareLinkCard, ReferralForm, ReferralList, GetLinkCard untouched (already restyled; not green/yellow heavy)

## Verification
- `tsgo --noEmit` typecheck
- Build
- Public `/refer` screenshot to confirm blue/black palette
