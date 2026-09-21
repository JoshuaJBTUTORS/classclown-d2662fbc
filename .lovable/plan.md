# Rename HeyCleo Menu Item to "HeyCleo (Homework)"

The sidebar entry that opens HeyCleo currently reads just **HeyCleo**. It will read **HeyCleo (Homework)** so it is obvious what it is for.

## What changes

- The label of the HeyCleo row in the sidebar menu (first item under "Core Operations" / "Lesson Management") changes from `HeyCleo` to `HeyCleo (Homework)`.
- Everything else about that row stays exactly as it is: the 👋 icon, who can see it (admin, owner, tutor, parent, student), and the behaviour of opening HeyCleo when clicked.
- This applies on desktop and mobile, since both use the same menu list.

## Technical notes

- Single text change in `src/components/navigation/Sidebar.tsx` (line 67): `label: 'HeyCleo'` becomes `label: 'HeyCleo (Homework)'`.
- The row already renders its label with text truncation inside a 256px-wide sidebar; at 14px the new label is roughly 130px wide against about 160px of space, so it fits without clipping. If it ever looks tight, the parentheses wording can be shortened rather than changing layout.
- The separate admin entry "HeyCleo Data" and the existing "Homework" page (admin/owner only) are untouched — no routing, permission, or data changes.
