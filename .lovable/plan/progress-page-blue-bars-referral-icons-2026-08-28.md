# Progress page: blue bars + referral icons

## Homework by month chart
- Remove the score-based colour switch (mint / butter / blush) so every bar uses the same tone.
- Use a single soft, opaque blue drawn from the pastel sky token (`--pastel-sky` family), so bars read as one calm blue regardless of score.
- Keep everything else the same: month arrows, average baseline, gridlines, labels, tooltips, month-label colours become the same muted tone instead of per-score colours.

## Referral panel icons
- Replace the current three step icons with hand-drawn doodle icons that match the ClassClown design language: a paper-plane/link doodle for "Share your link", a doodle lesson/chat bubble for "They try a free lesson", and a doodle coin/gift for "You both get £50".
- Keep the circular pastel icon chip, but tint each chip with a soft pastel surface instead of plain grey so it feels on-brand.

## Technical notes
- `src/components/progress/ProgressChart.tsx`: delete `barTone`, apply one blue class to all bars.
- `src/components/progress/ProgressDoodles.tsx`: add the new doodle SVGs (same stroke style as existing doodles).
- `src/components/progress/ReferralInvite.tsx`: swap `DoodleSpark`/`DoodleBook`/`DoodleStar` for the new icons and pastel chip backgrounds.
- No data, query, or logic changes.
