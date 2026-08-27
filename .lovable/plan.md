# Fix: /settings right-hand whitespace

## Diagnosis so far

- No width cap remains on the settings page shell: `src/pages/Settings.tsx` uses `w-full` / `flex-1` / `min-w-0`, `#root` in `src/App.css` has `width: 100%` and no max-width, and none of the settings components (`SettingsSection`, `ProfileSettings`, `SecuritySettings`, `ProfileIconSettings`, `AppVersionControl`) use `max-w-*` or `mx-auto`.
- The remaining whitespace is inside the sections: the inner content grids use fixed column counts (`xl:grid-cols-4`, `xl:grid-cols-3`), so on wide screens the fields stop short of the right edge, and the header paragraph is capped at `max-w-2xl`.

## Changes

1. `src/pages/Settings.tsx`
   - Remove `max-w-2xl` from the header description so header content spans the full width.
2. `src/components/settings/ProfileSettings.tsx`
   - Change the fields grid from `md:grid-cols-2 xl:grid-cols-4` to a fluid grid (`repeat(auto-fit, minmax(260px, 1fr))` style classes) so fields stretch to fill the full row width at any viewport.
3. `src/components/settings/SecuritySettings.tsx`
   - Same fluid-grid treatment for the password fields so they fill the section width.
4. Verify in the live preview with a Playwright screenshot at the user's viewport (1645px): measure the accordion content right edge against the viewport right edge to confirm there is no dead space.

## Technical notes

- No logic, routing, or data changes — layout classes only.
- Fluid grids via Tailwind arbitrary values: `grid-cols-[repeat(auto-fit,minmax(260px,1fr))]`.
