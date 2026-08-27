# Animated "Top-tier teachers" slide

Replace the static cartoon teacher image on the `/auth` showcase with an animated scene in the style of the attached graphic: a bearded tutor at a chalkboard, with equations and diagrams that appear to be drawn live.

## The scene

- Dark chalkboard panel with a subtle chalk-dust texture, framed in the existing rounded card (1.75rem radius, soft border).
- Tutor illustration in the attached flat cartoon style — purple shirt, dark tie, chalk pen raised to the board — sitting on the right-hand side of the frame.
- Board content around him: algebraic expressions, a sine wave with axes, a sector/angle diagram, and a boxed formula, all in chalk-white line work.

## The animation

- Chalk strokes draw themselves on: each equation and diagram animates in sequence using SVG stroke-dashoffset, so lines appear as if written in real time.
- Sequence loops: strokes draw over ~5s, hold briefly, fade out, restart — timed so a full cycle fits inside the 6s slide rotation.
- The tutor's writing arm makes a small repeating nudge in sync with the drawing, and the chalk tip sits at the leading edge of the current stroke.
- Faint chalk-dust glow follows the tip.
- `prefers-reduced-motion`: no drawing loop — the finished board is shown fully drawn and static.

## Technical notes

- New component `src/components/auth/TeacherChalkboard.tsx`: the figure rendered as an image layer, the board content as inline SVG paths animated with Tailwind/CSS keyframes on `stroke-dasharray` / `stroke-dashoffset`, staggered by `animation-delay`.
- Generate a new transparent-background PNG of just the tutor figure (no board text baked in) so the animated chalk sits behind and around him; replaces `src/assets/auth/teacher-cartoon.jpg`.
- `AuthShowcase.tsx` slide 2 swaps its `<img>` card for `<TeacherChalkboard />`; headline and subline copy stay as they are.
- Chalk colour uses foreground/background tokens over a dark board surface token — no hardcoded hex.
- No change to rotation logic, dots, hover-pause, the sign-in form, or auth behaviour.
