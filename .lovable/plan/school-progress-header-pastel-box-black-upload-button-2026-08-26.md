# School Progress header: pastel box + black Upload button

Bring back the hero header as a rounded pastel box with the scribble ("tiger stripe") motif, but in a non-green pastel tone, and restore the Upload Document button as a black pill.

## Change
- **`src/components/schoolProgress/SchoolProgressHero.tsx`**: restore the rounded pastel box header.
  - Wrapper: `rounded-[1.5rem] bg-pastel-butter` (warm yellow, not green) with `shadow-[var(--shadow-soft)]` and `overflow-hidden`.
  - `ScribbleStroke` accent in the top-right corner (`text-foreground/15`) — the "tiger stripe" motif.
  - Heading + subtitle in `text-pastel-butter-foreground`; document count as a `bg-background/70` stat pill.
  - Keep the pastel student picker (hashed tone per child).
  - **Upload Document button**: `bg-foreground text-background` black pill with `Plus` icon, lifts on hover. (Not green.)
- **`src/pages/SchoolProgress.tsx`**: restore the props passed to `SchoolProgressHero` (`canUpload`, `showUpload`, `onToggleUpload`) that were removed in the previous edit.
- No data or logic changes; the empty-state Upload button and the upload form stay as-is.

## Verify
- Build passes.
- `/school-progress`: header is a warm pastel box with scribble motif; Upload Document button is black, not green.
