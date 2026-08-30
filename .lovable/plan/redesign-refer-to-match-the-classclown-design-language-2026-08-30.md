# Redesign /refer to Match the ClassClown Design Language

Visual-only redesign of the Refer a Friend page (`src/pages/ReferFriend.tsx`) and its referral components to match the attached ClassClown design language (Plus Jakarta Sans headings, rounded pastel surfaces, thin black outlines, doodle icons, chip-style buttons like the calendar "Request Topic" button).

**No UX/functionality changes** — same sections, same buttons, same handlers, same copy, same form fields, validation, submission, copy-to-clipboard, WhatsApp/email share links, referral list, and public vs authenticated flows.

## Current state

- `/refer` renders `ReferFriend.tsx` with a hero card (badge, "Give £50, get £50" headline, 3 step tiles, `GiftIllustration`), then either:
  - **Logged in:** `ShareLinkCard` (link input + Copy/WhatsApp/Email buttons + "win-win" aside) and a 2-col grid of `ReferralForm` + `ReferralList`.
  - **Public:** `GetLinkCard` (name/email → link) + public `ReferralForm`.
- All components use generic card/border styling (`border-border bg-card/90`), emoji glyphs, default shadcn buttons/inputs/badges.

## What changes (visual only)

### Hero section (`ReferFriend.tsx`)
- ClassClown hero card: rounded-3xl surface with thin black outline and subtle shadow, soft pastel tint behind the illustration.
- "Refer a friend" badge → outlined pill chip with small doodle icon (SVG sparkle/gift) instead of emoji circle.
- Headline stays "Give £50, get £50" in Plus Jakarta Sans, with the accent phrase in the brand accent tone.
- Step tiles: rounded-2xl white cards with thin black outline, doodle-style icon chips (link, graduation cap, coin) aligned at the start of each tile.
- Back/Log-in ghost button restyled as a transparent outlined pill.

### ShareLinkCard
- Card → rounded pastel-white surface with black outline.
- Link input: rounded-xl, thin black outline, doodle link icon at leading edge.
- Copy button: black-filled pill; WhatsApp/Email: transparent outlined pill chips (matching Request Topic style), small doodle icons.
- "It's a win-win" aside: pastel panel with outline, £50/£50 OFF values as bold outlined pills.

### GetLinkCard / ReferralForm
- Same card treatment; inputs and selects get rounded-xl black-outline styling; dial-code select matches.
- Submit buttons: black pill with subtle shadow; error text unchanged in behavior.
- "Your details" public section → pastel outlined sub-panel.
- Card headers use Plus Jakarta Sans with a small doodle accent.

### ReferralList
- Card restyled; status badges → pastel category chips with thin outlines (e.g. Joined/Reward paid = green tint, Trial booked = orange/peach tint, Invited = neutral outline).
- Rows get subtle divider/hover treatment; initials avatar circle per referral.

### Shared
- Consistent spacing, responsive stacking preserved (mobile already stacks; kept intact).
- Verify with typecheck/build. Visual verification limited to public `/refer` view (external unmanaged Supabase — authenticated view can't be driven end-to-end).

## Files touched
- `src/pages/ReferFriend.tsx`
- `src/components/referral/ShareLinkCard.tsx`
- `src/components/referral/GetLinkCard.tsx`
- `src/components/referral/ReferralForm.tsx`
- `src/components/referral/ReferralList.tsx`
- Possibly `src/components/referral/GiftIllustration.tsx` (visual restyle only if needed)

## Out of scope
- No new features, fields, buttons, or copy changes.
- No changes to `useReferral` hook, edge functions, or routing.
