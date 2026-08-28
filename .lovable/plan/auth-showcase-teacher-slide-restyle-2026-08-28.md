# Auth showcase: teacher slide restyle

## What changes

On the `/auth` login showcase, the "Taught by top-tier teachers" slide currently shows a cartoon tutor standing in front of a dark chalkboard. Remove the tutor illustration entirely and keep only the self-drawing whiteboard animation, restyled to match the "Results families trust" slide.

## New look

- Light card instead of the dark board: soft white/background surface, rounded-2xl corners, hairline border, the same soft drop shadow used by the results rows.
- Strokes drawn in a muted foreground ink tone (not white chalk), still animating on in sequence and looping, with the finished board shown statically when reduced motion is on.
- A small pastel rounded-square icon badge in the corner echoing the mint/sky/blush badges on the results slide.
- Heading and supporting copy stay as they are.

## Technical notes

- `src/components/auth/TeacherChalkboard.tsx`: drop the `teacher-figure.png` import, the tutor `<img>`, the arm-wiggle and chalk-dust effects. Swap the dark `bg-foreground` / `text-background` container for a light surface with foreground-toned strokes; keep the `stroke-dashoffset` draw keyframes and per-path delays. Rework the SVG layout so the strokes fill the space the figure occupied. Rename the component/file to `WhiteboardScene` for clarity.
- `src/components/auth/AuthShowcase.tsx`: update the import/usage in `TeachersSlide`.
- Remove `src/assets/auth/teacher-figure.png` if nothing else references it.
- Colours stay on semantic tokens only.
