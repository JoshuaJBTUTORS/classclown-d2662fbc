# Proposal: black and white plus one accent colour

## What changes
The lesson proposal currently uses several pastel colours (mint, butter, lilac, sky, blush, sand). These will be cut down to **black, white, off-white/grey, and one accent colour: pastel mint**.

- The mint is used in only a few places that matter: the programme timing highlight, the "signed" confirmation, and the small accent dots in the results section.
- Everything else goes to black, white or soft grey:
  - Expired offer box: grey panel with black text (no blush)
  - Prepared-by details: grey panel (no sky)
  - Schedule rows: alternate white and soft grey (no rainbow rows)
  - Benefit tiles: white tiles with black outlined icon chips
  - Stat cards: grey, with mint used only once
  - Pricing block: stays solid black
- Wording, prices, dates, countdown, video, signing and payment stay exactly the same.

## Technical details
- File: `src/components/proposals/ProposalLayout.tsx` only.
- Replace `bg-pastel-butter|lilac|sky|blush|sand` (and `-foreground` variants) with `bg-muted` / `bg-background` / `text-foreground`.
- Keep `bg-pastel-mint` in at most 3–4 places; `Stat` `tone` prop reduced to `'mint' | undefined`.
- Check the result in a browser on desktop and mobile using the same proposal link.
