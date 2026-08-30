# Redesign /earnings (ClassClown visual language)

Visual-only redesign of the tutor earnings page. No UX changes: same sections, buttons, forms, handlers, data fetching, and conditional states. Only presentation changes.

## Design language
Consistent with previous ClassClown redesigns: Plus Jakarta Sans headings, soft cream/pastel surfaces, rounded-3xl cards with black outlines, doodle accents, black pill primary buttons, uppercase section labels.

## Files and changes

### src/pages/Earnings.tsx
- Full-width layout fix: ensure root uses `flex-1 w-full min-w-0`, remove `container mx-auto` constraint in favour of full-width padded content.
- Header: "Earnings" title with doodle accent (DoodleSparkle/coin-style accent), subtitle kept, Refresh button restyled to the black-outlined pill (Request Topic-style chip pattern used elsewhere).
- Loading state skeletons restyled as pastel rounded-3xl outlined cards.
- Empty states ("Select a Date Range", "Get Started with Your Earnings Goals", no-goal wheel placeholder): pastel dashed-outline rounded cards with doodle icon, replacing generic Card look and the 🎯 emoji with a doodle-style target SVG.

### src/components/earnings/EarningsDateFilter.tsx
- Restyle card: rounded-3xl, black outline, pastel header chip with doodle calendar icon, uppercase label.
- From/To date trigger buttons: rounded-full outlined pill buttons.
- Calendar popovers: rounded-2xl, black outline, soft surface.
- Clear Filter: small black-outlined pill ghost button.
- Payment Period / Next Payment Date rows: pastel info strip inside the card, values in bold.

### src/components/earnings/EarningsSummaryCards.tsx
- Three stat cards as pastel surfaces (e.g. mint, peach, lilac) with rounded-3xl black outlines, doodle icons in small outlined circles, big Plus Jakarta Sans numbers, uppercase small titles.
- Keep the same three cards, values, and description text (including the red "days remaining" urgency cue, mapped to a pastel red/terracotta tone).

### src/components/earnings/EarningGoalSetter.tsx
- Card restyled rounded-3xl outlined; doodle target icon chip in header.
- Amount input and Period select: rounded-full/rounded-xl outlined controls with soft focus ring.
- Submit button: black pill button (matches design system primary).
- No changes to validation, toasts, or submit logic.

### src/components/earnings/EarningsProgressWheel.tsx
- Card restyled rounded-3xl outlined with soft pastel background.
- Wheel track uses a light neutral; progress ring keeps its color logic but mapped to design tones (terracotta/deep teal/success green, not raw destructive red).
- Center percentage in Plus Jakarta Sans bold; earnings figures bold; "Goal exceeded" message as a pastel success chip instead of emoji-styled text (emoji kept if trivial to preserve — no content removed).

## Impact assessment
- Earnings data flow (getTutorEarningsData, setTutorEarningGoal), date filtering, goal setting, refresh, and period calculations are untouched — only className/JSX markup changes.
- No shared components outside the earnings folder are modified, so other pages are unaffected.
- Doodle icons reuse the existing SidebarDoodles / doodle SVG pattern already in the codebase.

## Verification
- Typecheck + build.
- Visual check of /earnings on desktop and mobile widths.
