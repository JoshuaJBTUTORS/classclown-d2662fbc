# Expand Account Settings to the full desktop width

## Confirmed cause

The selected settings container already has `w-full`, and its `<main>` already uses `flex-1 min-w-0`. The remaining blank space comes from the outermost `/settings` page wrapper: it is rendered as a direct flex child of `MainLayout`, but only has `min-h-screen bg-background`. Without `w-full` or `flex-1`, that route wrapper can shrink to its content width, so inner `w-full` rules cannot reach the viewport edge.

## Changes

- Update the outermost wrapper in `src/pages/Settings.tsx` to fill the width available from `MainLayout` using normal flex sizing.
- Keep the existing fixed-width desktop sidebar and allow the selected settings content to consume all remaining space beside it.
- Preserve the current mobile sidebar behavior, padding, accordion design, and settings functionality.
- Avoid viewport-width calculations so the previous green horizontal scrollbar does not return.

## Verification

- Check the rendered desktop bounding boxes to confirm the page wrapper reaches the viewport edge and the selected element fills the area beside the sidebar.
- Confirm there is no horizontal overflow at the current desktop viewport.
- Check the latest build result for errors.
