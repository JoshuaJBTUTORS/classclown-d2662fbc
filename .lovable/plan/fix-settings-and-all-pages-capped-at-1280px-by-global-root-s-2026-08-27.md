# Fix: `/settings` (and all pages) capped at 1280px by global `#root` style

## Root cause (confirmed)

`src/App.css` is leftover Vite template CSS:

```css
#root {
  max-width: 1280px;
  margin: 0 auto;
  text-align: center;
  padding: 2rem; /* on lg screens */
}
```

This wraps the **entire app** in a centered 1280px box, so the full-width accordion layout inside `Settings.tsx` can never be wider than 1280px. The page-level `2xl:max-w-[1600px]` cap is irrelevant while this global cap exists. Only `ModuleDetail.tsx` escapes it today by adding a `#root.learning-hub-page` override class at runtime.

## Fix

1. **`src/App.css`** — remove the Vite template rules from `#root`:
   - Drop `max-width: 1280px`, `margin: 0 auto`, `text-align: center`, and the responsive padding blocks.
   - Keep the `#root.learning-hub-page` rule (harmless; still used by ModuleDetail).
   - Leave the unused `.logo` / `.card` template styles alone, or remove them in the same pass — they are dead template CSS (no matches in `src/`); will confirm with a search before deleting.

2. **Verify no page depended on the centered 1280px box:**
   - Pages already manage their own width (`container mx-auto`, `max-w-*`, or full-bleed flex layouts), so removing the global cap should not visibly change centered pages — their inner containers still constrain them.
   - After the change, spot-check `/settings` (should now stretch to ~1600px), plus a page with a `container` (e.g. landing/auth) to confirm no layout drift, via the preview.

## Not changing

- No changes to `Settings.tsx` — its layout is already correct; it was being boxed in by the global CSS.
