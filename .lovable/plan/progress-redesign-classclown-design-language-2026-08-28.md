# /progress Redesign — ClassClown Design Language

A visual and structural redesign of the progress page. Same data, same filters, same roles — a much more expressive layout using the pastel/scribble design language already in the app.

## The idea: a "progress report card"

Instead of four flat stat boxes plus three equal chart cards, the page becomes a stacked, editorial report:

```text
┌───────────────────────────────────────────────────────────┐
│  HERO BAND (pastel, scribble motif)                       │
│  "Your Progress"      [ ring 81% ]   Homework average     │
│  short human sentence  ← streak / trend chip              │
│  filters as inline pastel pills (date range · subjects)   │
└───────────────────────────────────────────────────────────┘

┌── At a glance ────────────────────────────────────────────┐
│ [mint tile]   [sky tile]   [butter tile]   [blush tile]   │
│ Homework avg  Attendance   Homework done   Trend          │
│ big number + sparkline strip + tiny doodle icon           │
└───────────────────────────────────────────────────────────┘

┌── Homework over time (wide, 2/3) ──┐ ┌── Attendance (1/3)─┐
│ soft-filled area chart, pastel     │ │ week dots grid,    │
│ gradient, rounded dots, no grid    │ │ colour = % band    │
└────────────────────────────────────┘ └────────────────────┘

┌── Assessments ────────────────────────────────────────────┐
│ locked → friendly pastel panel; unlocked → chart as today │
└───────────────────────────────────────────────────────────┘
```

## What changes

- **Hero band**: pastel panel with the `ScribbleStroke` motif, heading font, a large circular progress ring for the headline metric, and a one-line plain-English summary ("11 homeworks tracked, averaging 81% this term").
- **Filters**: move out of the boxy "Filters" card into compact pill controls inside the hero band. Same date-range and subject controls, same behaviour.
- **Stat tiles**: replace the white stat cards with pastel tiles (mint / sky / butter / blush) using `getPastelTone`-style tokens, big numbers in the heading font, hand-drawn doodle icons instead of Lucide, and a mini sparkline where a trend exists.
- **Homework chart**: full-width-ish area chart with pastel gradient fill, rounded stroke, no hard grid lines, pastel tooltip card. Empty state gets a friendly doodle instead of a grey icon.
- **Attendance**: swap the bar chart for a week-dot grid (one soft rounded square per week, shade by attendance band) with a small legend — far more readable than the current dense bar forest, and much more on-brand. Keeps the same weekly aggregation.
- **Assessment card**: keeps its logic; the locked state becomes a pastel panel with a doodle padlock and pill CTA instead of the purple button.
- **Colour cleanup**: remove hardcoded `bg-white`, `text-gray-*`, `#e94b7f`, `#10b981` from these components in favour of design tokens.

## Scope guardrails

- No changes to data fetching, RLS, filter semantics, role gating, or `useHeyCleoProgress`.
- Assessment access/paywall logic untouched.
- Mobile: tiles stack 2-up, charts full width.

## Technical notes

- Files: `src/pages/Progress.tsx`, `src/components/progress/{ProgressSummary,ProgressFilters,ProgressChart,AttendanceChart,AssessmentProgressChart}.tsx`, plus a small new `src/components/progress/ProgressHero.tsx` and `StatTile.tsx`.
- Reuse `ScribbleStroke` and the `pastel-*` tokens from `tailwind.config.ts`; doodles follow the existing `DoodleIcons` pattern.
- Recharts stays as the chart lib (area chart via `<Area>` with a `linearGradient` def); the attendance dot grid is plain divs, no chart lib.
- Fonts: `font-heading` (Plus Jakarta Sans) for numbers and titles, body font elsewhere; radii 1.5rem, pills `rounded-full`.
