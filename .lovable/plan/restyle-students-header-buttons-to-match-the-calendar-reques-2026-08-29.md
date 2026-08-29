# Restyle /students header buttons to match the calendar "Request topic" chip design

## Goal
Make the **Cleo Onboarding** and **Add New** buttons on `/students` look identical to the calendar page's **Request topic** / **Refer a friend** chip style: transparent background, black outline, rounded-full pill, icon inside a small circular bordered chip.

## Reference (existing, to copy verbatim)
From `src/components/calendar/CalendarHero.tsx`:
```
chipBase: rounded-full pill, bg-transparent, border border-foreground (black outline),
          pl-2 pr-4, h-11, hover:-translate-y-0.5 hover:bg-foreground/5
chipIcon: h-7 w-7 rounded-full border border-foreground/70 circle wrapping the icon
```

## Changes (visual only — all behavior preserved)

### `src/pages/Students.tsx` (~lines 460–526)
1. **Cleo Onboarding** — replace the shadcn `Button` with a plain `<button>` using the exact `chipBase` classes; wrap `UserPlus` icon in the `chipIcon` circle. Same `onClick` navigation to `/onboarding`.
2. **Add New** (DropdownMenuTrigger) — replace the shadcn `Button` inside `DropdownMenuTrigger asChild` with the same chip-style `<button>`; `Plus` icon in the `chipIcon` circle, keep the `ChevronDown` (small, after the label). The dropdown menu, all menu items, and their handlers stay untouched.

## Explicitly unchanged
- No changes to the dropdown menu contents, dialogs, data fetching, role guards (admin/owner visibility), or navigation logic.
- No new icons/assets invented; keep existing lucide icons, just inside the circular chip container.

## Verification
- Typecheck/build passes.
- Buttons render as clear black-outline pills; hover lifts slightly; dropdown still opens and all five menu items still work.
