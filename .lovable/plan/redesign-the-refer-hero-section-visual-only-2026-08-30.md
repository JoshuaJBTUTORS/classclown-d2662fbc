# Redesign the /refer hero section (visual only)

## Goal
Rework the top hero of `/refer` (the `section` in `src/pages/ReferFriend.tsx` plus `src/components/referral/GiftIllustration.tsx`) so it reads as a real ClassClown hero, not a plain white card — bolder, more playful, more layered. No copy, props, hooks, or flow changes.

## Design changes

```text
┌──────────────────────────────────────────────────┐
│  ✦ pastel-mint wash + soft radial glows          │
│                                                  │
│  ( REFER A FRIEND ) pill        ┌──────────────┐ │
│                                 │  rotated £50 │ │
│  Give £50, get £50              │  sticker card│ │
│  (underline squiggle under £50) │    ✦  $  ☺   │ │
│  subtitle copy                  │   big teal £ │ │
│                                 └──────────────┘ │
│  ① Share link → ② Free lesson → ③ You get £50    │
│   numbered step cards with pastel icon discs     │
└──────────────────────────────────────────────────┘
```

1. **Section surface** — swap the flat white card for a `bg-pastel-mint` (or layered mint→butter) surface with the thin black ClassClown outline (`border-foreground`), `rounded-3xl`, soft shadow, and two faint blurred pastel glow blobs behind content for depth.
2. **Sticker card** — rebuild `GiftIllustration.tsx` as a playful composition: a slightly rotated white "£50 FOR YOU" sticker card with black outline and soft shadow, floating doodle coins/sparkle/smiley chips around it (pastel disc backgrounds, black outlines), gentle hover float animation.
3. **Headline treatment** — keep copy, but add a hand-drawn underline squiggle (inline SVG) under the green "get £50", tighten tracking, and give the "Give £50," / "get £50" split a two-line stacked rhythm on mobile.
4. **Step cards** — add numbered badges (①②③ style pastel discs with black outline) and pastel icon discs (`bg-pastel-blush` / `-butter` / `-sky`) so each of the three steps gets its own colour, connected feel via a dashed divider line on desktop.
5. **Refer-a-friend pill** — keep the outlined pill, put it on a pastel disc icon to match the new header chips.
6. Back/login pill above the hero stays as-is.

## Technical notes
- Files touched: `src/pages/ReferFriend.tsx` (hero `section` block only), `src/components/referral/GiftIllustration.tsx` (rewrite, still a pure decorative component accepting `className`).
- Reuse existing tokens: `bg-pastel-mint/blush/butter/sky`, `font-heading`, `border-foreground`, `shadow-[var(--shadow-soft)]`, doodles from `ProgressDoodles`.
- Rest of the page (ShareLinkCard, ReferralForm, ReferralList, GetLinkCard) untouched.
- Verify with typecheck + build and a fresh screenshot of public `/refer`.
