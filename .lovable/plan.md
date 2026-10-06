# Assessment Week notice: black-and-white banner across the top of the calendar

Replace the Assessment Week popup with a slim banner sitting along the top of the calendar page, styled in the ClassClown CRM black-and-white design language. The wording, the automatic appearance during 5–11 October, and the dismiss-for-this-visit behaviour all stay exactly as they are.

## What changes on screen

```text
Before                          After
--------                        -----
Popup in the middle of the      A solid black band across the top of the
screen, dimming the page        calendar page, above the page heading
Butter-yellow circle badge      White circle badge with a black clipboard icon
Cream notice box, tan border    Message printed straight onto the black band
Teal "Got it" pill              Small white "x" at the right end of the band
```

- **Placement** — the band sits at the very top of the calendar page, above the page heading, spanning the same width as the rest of the page content. The rest of the page is never dimmed or blocked, so students and parents can keep clicking around while it's showing.
- **Look** — solid black band with white text, soft rounded corners and the app's soft shadow, matching the black pill buttons and black arrow tiles used elsewhere. The clipboard-check icon sits in a small white circle at the left.
- **Text** — the exact approved wording: heading "Assessment Week: 5th October - 11th October", then the full "Please note that this week is Assessment Week across our lessons…" paragraph. On wide screens the heading and paragraph sit side by side on one line; on phones they stack.
- **Closing** — a small white "x" at the right end of the band. Clicking it hides the band for the rest of the visit; it comes back when the page is reopened, and disappears on its own after Sunday 11th October 11:59pm.

## Technical details

- Rename `src/components/calendar/AssessmentWeekPopup.tsx` to `AssessmentWeekBanner.tsx` and update the import in `src/pages/Calendar.tsx`; the date-window check (`formatInTimeZone` with `UK_TIMEZONE`, comparing against `2026-10-05` / `2026-10-11`) and the `useState` dismiss-for-this-visit behaviour are carried over unchanged.
- Drop the `Dialog`/`DialogContent` imports; the component returns a plain `<div role="status">` band instead.
- Render it as the first child of `<main>` in `src/pages/Calendar.tsx` (line 225 area), above the hero header, wrapped in the page's existing `px-4 md:px-8` padding so it lines up with the heading and tabs below.
- Band styling uses existing semantic tokens only: `bg-foreground text-background` for the band, `rounded-[var(--radius-soft)]` and `shadow-[var(--shadow-soft)]` for shape and depth, `text-background/75` for the paragraph, and a `bg-background text-foreground` circle for the icon. The dismiss control is a ghost icon button with `hover:bg-background/10`. No hardcoded hex, so dark mode inverts it cleanly.
- Keep the `ClipboardCheck` icon from lucide-react; no new dependencies.
- Because the band sits above the calendar grid, the grid loses a little vertical height on short screens — the page already scrolls internally, so nothing gets cut off.

## Verification

1. Build passes (checked in `build-errors.log`).
2. On the calendar during Assessment Week: the black band appears at the top with the heading and full paragraph, the page behind stays fully clickable, and the "x" removes it until the page is reloaded.
3. Outside 5–11 October the band renders nothing, and no popup appears anywhere on the page.
4. Check a narrow phone viewport: heading and paragraph stack, the "x" stays tappable.
