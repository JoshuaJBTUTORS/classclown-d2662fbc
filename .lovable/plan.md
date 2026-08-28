# Plan: Remove calendar event tiger stripes

## Goal
Remove the diagonal "tiger stripe" pattern that fills each calendar lesson box, leaving a clean solid pastel fill. The black bottom-right arrow buttons added last turn stay.

## Root cause (confirmed via code read)
In `src/index.css`, each year-group event color rule layers a `repeating-linear-gradient` stripe overlay on top of the solid base color:

```css
.fc-event.ks2-event {
  background: hsl(var(--event-ks2)) repeating-linear-gradient(
    45deg,
    hsl(var(--event-ks2-stripe) / 0.1) 0 6px,
    transparent 6px 12px
  ) !important;
  ...
}
```

This pattern is repeated across six rules: `ks2-event`, `sats-event`, `eleven-plus-event`/`a-level-event`, `ks3-event`, `gcse-event`, and `year-11-event`.

## Change
Edit `src/index.css` to drop the `repeating-linear-gradient(...)` segment from the `background` value in each of those six rules, keeping only the solid `hsl(var(--event-*))` fill and the existing `color` rule. Example result:

```css
.fc-event.ks2-event {
  background: hsl(var(--event-ks2)) !important;
  color: hsl(var(--pastel-blush-foreground)) !important;
}
```

No other files change. The stripe-related CSS variables (`--event-*-stripe`) become unused but are left in place (harmless).

## Out of scope
- Arrow button position (already moved to bottom-right last turn).
- Pastel color tokens themselves (unchanged).
