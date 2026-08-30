# Proposals sidebar restyle + actions dropdown

## 1. Sidebar redesign (shared by /admin/proposals and /admin/proposals/signed)
Restyle `AdminProposalSidebar` in the ClassClown language, keeping the same two groups and the single working link:

- Soft cream/card panel with a subtle right divider instead of the plain grey rail.
- Statistics shown as two rounded pastel stat cards (black outline, pastel lilac and mint icon circles, big Plus Jakarta numerals) rather than loose rows.
- Group labels ("Statistics", "Quick Links") as small uppercase muted captions.
- "Signed Proposals" becomes a full-width rounded pill: black outline, doodle-style file icon in a pastel circle, bold label, active state filled black with cream text when on /admin/proposals/signed.
- Collapsed state keeps the icon circles only, so the collapse toggle still works.

## 2. Actions dropdown on /admin/proposals
The row currently shows up to six icon buttons. Replace with:

- One black round arrow button (open proposal) kept inline as the primary action.
- A round outlined "..." button opening a dropdown menu, styled with rounded corners and black outline, containing: Resend (only for sent/viewed/agreed, with its spinner state), Extend discounted rate (with the existing deadline tooltip text as the item label suffix), Edit, Copy link, and Delete in destructive red.

All handlers, conditions, disabled states and permissions stay exactly as they are; only the presentation changes. The actions column narrows in the shared grid so the other columns get more room.
