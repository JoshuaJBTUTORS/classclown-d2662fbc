# Assessment Week popup: black-and-white treatment

Restyle the calendar Assessment Week popup so it reads as pure monochrome, matching the ClassClown CRM design language used on the trial booking, earnings and referral screens — soft rounded surfaces, shadow for depth, and a solid black pill button. The wording, the automatic opening, the "dismiss for this visit" behaviour and the Sunday 11:59pm cut-off all stay exactly as they are.

## What changes on screen

```text
Before                          After
--------                        -----
Butter-yellow circle badge      Solid black circle, white clipboard icon
Cream notice box, tan border    Soft grey panel, hairline grey edge
Teal "Got it" pill              Black "Got it" pill, white text
```

- **Icon badge** — the circle behind the clipboard-check becomes solid black with the icon knocked out in white, the same black-on-white device used for the arrow buttons on the subject tiles.
- **Notice panel** — the cream box becomes a barely-there grey panel (a faint black wash with a hairline grey edge), keeping the same rounded corners and padding. Depth comes from the soft shadow rather than colour.
- **Button** — "Got it" becomes the black pill used elsewhere in the app: fully rounded, black fill, white label, lifting slightly on hover.
- **Dialog shell** — wider corner radius and the soft elevated shadow, so the popup sits on the page like the other redesigned surfaces. The grey close "x" is already monochrome and stays.

Everything stays legible in dark mode, where the same pieces flip to white-on-black automatically.

## Technical details

- File touched: `src/components/calendar/AssessmentWeekPopup.tsx` only — no logic, date-window, or routing changes.
- Replace `bg-pastel-butter text-pastel-butter-foreground` on the badge with `bg-foreground text-background`.
- Replace `border-pastel-butter-foreground/20 bg-pastel-butter/60` on the notice panel with a monochrome wash: `border-foreground/10 bg-foreground/[0.04]`, keeping `rounded-lg`-or-softer corners and the existing padding.
- Give the button the app's black-pill treatment: `bg-foreground text-background hover:bg-foreground/90` with `rounded-full`, applied via className on the existing `<Button size="lg" className="w-full">` so the shared component and its variants are untouched.
- Add `rounded-3xl shadow-[var(--shadow-soft-lg)]` to `DialogContent` so the shell matches the soft-radius/shadow depth of the rest of the app.
- All values are existing semantic tokens (`--foreground`, `--background`, `--shadow-soft-lg`) — no hardcoded hex, no new tokens, so dark mode and any future re-theming keep working.
- Heading font is already Plus Jakarta Sans globally (h1–h6 rule in `src/index.css`), so no typography change is needed.

## Verification

1. Build passes (checked in `build-errors.log`).
2. Preview the calendar during Assessment Week: the popup opens with the black badge, grey panel and black "Got it" pill; clicking it closes the popup and it does not return until the page is reloaded.
3. Confirm no pastel or teal remains in the popup, and that the text still matches the approved wording exactly.
