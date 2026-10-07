# Restyle the lesson proposal in ClassClown’s black-and-white language

Redesign the customer-facing proposal document shown at the public proposal link. The reference is the calendar’s **Request topic** control: crisp black outlines, near-black type, off-white space and confident pill actions. Pastel colours from the uploaded design guide appear only in selected information blocks.

## Visual direction
- Keep the page predominantly black, white and off-white; remove the current teal-heavy treatment.
- Use the exact Request Topic vocabulary: transparent black-outlined pills, outlined circular icon chips, solid black primary actions and a subtle lift on hover.
- Retain Plus Jakarta Sans for bold headings and Inter for body copy.
- Use colour sparingly and purposefully: blush for an expired offer, mint for programme timing, sky for prepared-by details, lilac/butter/sand for selected supporting sections.
- Use soft 1.5rem corners and shadow-only depth on pastel surfaces; avoid decorative gradients, harsh colours and generic visual clutter.

## Proposal page
- Restyle the sticky header, contact/print actions and confirmation button in the black-and-white chip language.
- Give the opening a cleaner editorial hierarchy: strong recipient headline, compact offer-status treatment and more deliberate whitespace.
- Turn programme start date and term into separate asymmetric pastel tiles rather than one teal bordered panel.
- Restyle the prepared-by details, CEO video frame and key metrics so they feel like one coherent ClassClown composition.
- Carry the same system through the full document:
  - schedule as clean pastel lesson rows on mobile and a precise monochrome table on desktop;
  - included benefits as restrained alternating pastel tiles;
  - results as bold black typography with small colour accents;
  - pricing and contract terms as a high-contrast focal section;
  - FAQs and terms as calm, readable monochrome surfaces;
  - signed and payment-next-step states using the same component language.
- Keep the desktop section navigation useful but make it visually quieter; preserve the mobile jump menu and sticky confirmation action.

## Behaviour preserved
- No proposal copy, pricing, dates, lessons, countdown logic or contractual content changes.
- Keep section tracking, smooth navigation, video, contact links, printing, signing, payment continuation and signed-document watermark unchanged.
- Keep the proposal responsive and print-friendly.

## Technical scope
- Update `src/components/proposals/ProposalLayout.tsx` only; reuse the existing semantic `foreground`, `background`, `card`, `muted`, `pastel-*`, `--radius-soft` and `--shadow-soft*` tokens.
- Reuse the shared `Button` component for actions and existing icons; no new images or design dependencies.
- Verify the real proposal at desktop and mobile sizes, including its lower sections and signed/unsigned action states, then confirm the project build remains clean.
