# Assessment Center — Lesson Plans design refresh

Apply the pastel design language from `/lesson-plans` to `/assessment-center`, including layout changes.

## Design language being reused

- Typography: Plus Jakarta Sans headings (`font-heading`, extrabold, `tracking-tight`), Inter body.
- Surfaces: soft `--radius-soft` corners, `--shadow-soft` depth instead of borders, rotating pastel tones (mint, lilac, butter, blush, sky, sand) via `getPastelTone`.
- Motifs: hand-drawn `ScribbleStroke`, circular icon badge on a white pill, black circular arrow button punched out of the tile.
- Controls: pill-shaped search input, pill buttons.

## Layout changes

```text
[ Hero ]  "Assessment Center" + subtitle
          pill search box            [ 3 quick stat pills: To do / Due soon / Completed ]

[ Pill tab bar ]  All · Pending · Due soon · Completed

[ Responsive card grid (1 / 2 / 3 cols) of pastel assessment tiles ]

[ Pastel empty state card ]
```

1. **Hero** — new `AssessmentHero` styled on `LessonPlansHero`: large heading, short subtitle, pill search that filters by assessment title/subject/exam board, plus three small stat pills (pending, due soon, completed).
2. **Tabs** — replace the default `TabsList` with a pill-shaped rounded-full bar; active tab is a solid dark pill, inactive are soft cards. Same four tabs and same filtering logic as today.
3. **Cards** — replace the wide stacked rows with a pastel tile grid. Each tile:
   - pastel tone derived from the assessment subject (stable per subject),
   - scribble stroke motif at the top-right,
   - white circular badge with a subject-appropriate icon; small dot when overdue,
   - title in extrabold heading font, subject · exam board · year beneath,
   - meta chips for marks, time limit and due date on translucent white chips,
   - status chip (Assigned / In progress / Submitted / Reviewed) and Overdue / Due soon chip,
   - the whole tile is clickable and carries the black circular arrow button in a punched-out notch; the action it triggers is unchanged (Start / Continue for pending, View submission for completed),
   - instructions note, when present, in a subtle footer line.
4. **Empty & loading states** — pastel `EmptyState`-style card per tab, and skeletons shaped like the new tiles.

## Notes

- Visual/layout only: data fetching, filtering rules, and the navigation to `/assessment-center/:id/take` stay exactly as they are.
- All colours come from existing semantic tokens (`bg-pastel-*`, `text-*-foreground`, `--shadow-soft`) — no hardcoded hex or `text-white`/`bg-black`.
- The `amber-100` due-soon badge is swapped for the pastel butter token.

## Files

- `src/pages/AssessmentCenter.tsx` — restructured page
- `src/components/assessments/AssessmentHero.tsx` (new)
- `src/components/assessments/AssessmentCard.tsx` (new pastel tile)
- Reuses `src/components/lessonPlans/ScribbleStroke.tsx` and `pastelPalette.ts`
