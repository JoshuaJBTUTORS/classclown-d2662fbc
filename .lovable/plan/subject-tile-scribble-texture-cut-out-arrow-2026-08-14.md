# Subject tile: scribble texture + cut-out arrow

Rebuild the Lesson Plans subject tile so it matches the reference exactly: a big pastel rounded square with a painted scribble stroke across the top, a white circular star badge top-left, the subject name in bold display type at the bottom-left, a meta line under it, and a black circular arrow button that sits in a notch cut out of the tile's right edge.

## What the tile looks like

```text
+-----------------------------+
| (★)      ~~~scribble~~~     |
|        ~~~~~~~~~~~          |
|                        (↗)  <- black circle sitting in a
|                             |    rounded cut-out of the edge
| Subject Name                |
| 12 weeks · 3 terms          |
+-----------------------------+
```

- **Scribble**: a hand-painted brush squiggle in the upper area, drawn as an inline SVG in a lighter shade of the tile's own pastel tone (white at low opacity), so it recolours automatically per subject.
- **Star badge**: white circle, outline star, top-left, purely decorative in this pass.
- **Cut-out arrow**: the arrow button overlaps the right edge. The tile gets a rounded concave notch behind the button so the black circle appears to be punched out of the card, exactly like the reference. Hovering rotates the arrow slightly and lifts the card.
- **Text block**: subject name large and bold at bottom-left; the current week/term/plan counts collapse into one quiet meta line instead of three pill chips, matching the "By Amy Johnson" position and weight.
- Recently-updated subjects keep a small marker, shown as a dot on the star badge rather than an extra pill.

Pastel colour assignment per subject stays exactly as it is today (mint, lilac, butter, blush, sky, sand rotating by subject name).

## Technical notes

- Only `src/components/lessonPlans/SubjectCard.tsx` is rewritten; a small `ScribbleStroke.tsx` SVG component is added next to it.
- The notch is done with a CSS mask (`radial-gradient` cut in `-webkit-mask-image` / `mask-image`) on the card surface, sized to match the button so it works on any tile width and in both themes. The button itself sits outside the masked layer so it stays crisp.
- Colours continue to come from the existing pastel HSL tokens and `getPastelTone`; no hardcoded hex or `bg-white`. The black circle uses `bg-foreground text-background` so dark mode inverts sensibly.
- Card height, grid, click behaviour, and all data props are unchanged.
