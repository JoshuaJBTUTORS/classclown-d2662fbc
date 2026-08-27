# Dynamic /auth showcase panel

Turn the static Cleo panel on the right of the sign-in page into an auto-rotating carousel that cycles a new slide every 6 seconds.

## Slides

1. **Learning, with Cleo** — Cleo mascot in the mint circle, "Live tutoring, lesson plans and progress — all in one friendly place." (current slide, unchanged)
2. **Top-tier teachers** — doodle/icon tile in place of the mascot, headline "Taught by top-tier teachers", subline about qualified subject specialists across 11 Plus, GCSE and A Level.
3. **Proven results** — headline "94% 11 Plus pass rate", with supporting stat chips for "97% Grade 8+ at GCSE" and "88% A*/A at A Level", styled like the uploaded results cards (soft card, pastel accent tile, subtle numbering).

## Behaviour

- Auto-advance every 6 seconds, looping.
- Crossfade + gentle slide-up transition between slides (Framer Motion `AnimatePresence`), matching existing float animation feel.
- Small dot indicators at the bottom of the panel; clicking a dot jumps to that slide and restarts the timer.
- Pauses on hover, and respects `prefers-reduced-motion` (no auto-advance, first slide shown).
- Panel stays desktop-only (`hidden lg:flex`) as today; mobile layout unchanged.

## Styling

- Keeps the pastel blob backdrop, ScribbleStroke accent, 1.75rem radius shell.
- Slide 2 and 3 use pastel tokens (`pastel-mint`, `pastel-sky`, `pastel-blush`) and `font-heading` for headlines — no hardcoded colours.
- Stat figures rendered in large bold heading type with a muted secondary half, echoing the "01/03" treatment from the reference.

## Technical notes

- Change is contained to `src/pages/Auth.tsx`, plus a new `src/components/auth/AuthShowcase.tsx` holding the slide data and rotation logic.
- No change to `signIn`, validation, redirects, `DomainSEO`, or the forgot/reset password screens.
