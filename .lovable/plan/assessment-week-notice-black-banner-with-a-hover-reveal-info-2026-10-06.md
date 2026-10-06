# Assessment Week notice: black banner with a hover-reveal info button

Replace the Assessment Week popup with a slim black banner along the top of the calendar page, built the same way as the payment warning band: the heading sits in the banner itself, and the full paragraph appears in a small popup when you hover (or tap) the info "i" button. Wording, the 5–11 October window, and dismiss-for-this-visit behaviour all stay as they are.

## What changes on screen

```text
Before                          After
--------                        -----
Popup in the middle of the      A solid black band across the top of the
screen, dimming the page        calendar page, above the page heading
Butter-yellow circle badge      White "i" info button at the right of the band
Cream notice box, tan border    Full paragraph shown only when you hover the "i"
Teal "Got it" pill              Small white "x" to close the band
```

- **The band itself** — one line of black along the top of the page, above the page heading, spanning the same width as the rest of the page content. It reads: a small clipboard icon, then **Assessment Week: 5th October - 11th October**, then an info "i" button, then a small "x". Nothing else — no paragraph, so the band stays thin and never dimmed the page.
- **The hover reveal** — hovering the "i" opens a white rounded popup just below it, containing the full approved paragraph:
  > Please note that this week is Assessment Week across our lessons. Lessons may look a little different than usual, as we'll be assessing students to better understand their current progress and identify the areas where they may need additional support going forward.
  On a phone, tapping the "i" does the same thing, and tapping elsewhere hides it again.
- **Closing** — the "x" hides the band for the rest of the visit; it returns when the page is reopened and stops showing altogether after Sunday 11th October 11:59pm.
- **Colour** — pure black and white throughout: black band, white icon and text, white info popup with black text and a soft shadow. Matches the black pill buttons used on the booking, earnings and referral screens.

## Technical details

- Rename `src/components/calendar/AssessmentWeekPopup.tsx` to `AssessmentWeekBanner.tsx`; update the import and the render site in `src/pages/Calendar.tsx` (currently line 23 import, line 338 render). The `formatInTimeZone`/`UK_TIMEZONE` date-window check against `2026-10-05` / `2026-10-11` and the `useState` dismiss-for-this-visit logic carry over unchanged.
- Drop the `Dialog` imports. The component returns a `<div role="status">` band, rendered as the first child of `<main>` in `src/pages/Calendar.tsx` (line 225), above the hero header, inside the page's existing `px-4 md:px-8` padding so it lines up with the heading and tabs.
- Band styling uses existing semantic tokens only: `bg-foreground text-background`, `rounded-[var(--radius-soft)]`, `shadow-[var(--shadow-soft)]`, `text-background/75` for the secondary text, and `hover:bg-background/10` on the icon buttons. No hardcoded hex, so dark mode inverts cleanly.
- The hover reveal reuses the app's existing tooltip component (`src/components/ui/tooltip.tsx`, Radix-based) exactly as `src/components/calendar/CalendarHeader.tsx` already does: `TooltipProvider` → `Tooltip` → `TooltipTrigger asChild` on a ghost icon `Button` holding `lucide-react`'s `Info` → `TooltipContent` holding the paragraph.
- `TooltipContent` gets `max-w-md`, `rounded-xl`, `p-4`, `text-sm leading-relaxed` and `shadow-[var(--shadow-soft-lg)]` so the whole paragraph reads comfortably; it keeps the default white `bg-popover` / black `bg-popover-foreground` tokens.
- Keep the `ClipboardCheck` icon for the band's leading glyph and `X` for the dismiss control; no new dependencies.
- The band takes roughly 56px of vertical space above the heading; the calendar grid below already scrolls internally, so nothing gets clipped.

## Verification

1. Build passes (checked in `build-errors.log`).
2. On the calendar during Assessment Week: the thin black band sits above the page heading, the page behind stays fully clickable, hovering the "i" reveals the full paragraph, and the "x" removes the band until the page is reloaded.
3. Outside 5–11 October the band renders nothing, and no popup appears anywhere on the page.
4. Narrow phone viewport: the band stays on one line, the "i" opens the paragraph on tap, and the paragraph is fully readable without clipping.
