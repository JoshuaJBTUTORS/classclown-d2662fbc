# Animated waving-hand loading screen

## Goal
Replace full-page loading screens with a playful ClassClown-style loader: a waving hand that animates as if it is "loading up" with a blue-to-pink ombre fill.

## Design
- A hand icon (SVG, waving 👋 shape) that rocks side to side with a wave animation.
- The hand fills with a blue → pink ombre gradient that rises/reveals continuously, like it's "loading up" with color (animated gradient clip or a shimmer sweep).
- Soft pastel glow behind the hand, matching the existing pastel design language.
- Small uppercase "Loading..." label underneath (optional prop so pages can pass custom text).

## Implementation

### 1. New shared component: `src/components/ui/loading-hand.tsx`
- SVG hand using a `<linearGradient>` from blue (`#60a5fa`-ish) to pink (`#f472b6`-ish).
- Wave motion via CSS keyframes (rotate oscillation at the wrist) added to `index.css` or tailwind config.
- Ombre "loading up" effect: an animated gradient overlay/mask that sweeps upward inside the hand on a loop, or gradient stop animation.
- Props: `text?: string`, `fullScreen?: boolean` (centers in `min-h-screen` when true).
- Sizes via `className` passthrough.

### 2. Replace full-page loading states
Swap the existing `Loader2 animate-spin` full-page blocks for the new component in the main page-level loading screens, including:
- StudentsList, StudentDetail, Tutors, Homework, Earnings, TimeOff, TimeOffRequests
- AdminDashboard, AgentCleo, ProposalView, SignedProposals, ProposalDashboard
- TrialBooking, Onboarding, WelcomeOnboarding, Auth, SchoolProgress, Referrals
- VideoRoom / EmbeddedVideoRoom, OfferView, Invite, CourseDetail/Checkout where full-page loaders exist

Button-level spinners (refresh icons, submit buttons) stay as-is — only full-page loading screens change.

### 3. Verify
- Typecheck + build.
- Screenshot a couple of loading states to confirm the wave + ombre animation renders.

## No changes to
- Any data fetching, timing, or logic — purely visual swap of the loading indicator.
