# /refer — badge & win-win panel tweaks

## Problems (confirmed from current code + screenshots)
1. Step number badges 1, 2, 3 are inconsistent: step 1 `bg-pastel-sky`, step 2 `bg-foreground/5`, step 3 `bg-foreground` (solid dark) — and step 3's dark background + dark `text-foreground` number makes the "3" nearly invisible.
2. Win-win panel (£50 OFF / £50 badges) uses `text-primary` (teal) — user wants black font.
3. "£50 OFF" wraps so "OFF" drops to a second line — user wants it on one line.

## Changes (visual only)

### `src/pages/ReferFriend.tsx`
- Make all three step badges uniform: set every `STEPS[].badge` to `bg-background` (white) so badges 1, 2, 3 are identical — white circle, black border, black number (existing `text-foreground`). Keeps the icon discs varied, only the number badges become consistent.

### `src/components/referral/ShareLinkCard.tsx` (win-win panel)
- Change the two amount badges (`£50 OFF`, `£50`) from `text-primary` to `text-foreground` (black).
- Add `whitespace-nowrap` to the `£50 OFF` badge so "OFF" stays on the same line as "£50".

## Non-goals
- No copy, layout, handlers, queries, or workflows changed.
- Panel background stays soft pink (`pastel-blush`).

## Verify
- `tsgo --noEmit` + build OK.
- Screenshot `/refer` (authenticated view) to confirm badges 1/2/3 match and "£50 OFF" is single-line black.
