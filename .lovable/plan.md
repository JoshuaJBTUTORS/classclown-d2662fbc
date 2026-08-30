# Proposals sidebar cleanup + Signed Proposals redesign

## 1. Sidebar (shown on both proposal pages)
- Remove the entire "Quick Filters" group (All Proposals / Sent / Viewed / Agreed / Completed). Those buttons have no click handlers today, so nothing functional is lost.
- Remove the "Settings" quick link (it goes nowhere).
- Keep the Statistics block (Total Proposals / Filtered Results) and the working "Signed Proposals" link.

## 2. Remove the top bar on /admin/proposals
- Delete the sticky 48px header strip above the page content.
- The only control in it is the sidebar collapse toggle, so it moves to a small floating round toggle pinned top-left of the content area, styled in the design language, so the sidebar can still be collapsed and reopened.

## 3. Redesign /admin/proposals/signed
Visual-only refresh to match the ClassClown language used on /admin/proposals:
- Same page shell: full-width flex layout, no top bar (floating collapse toggle instead), big heading "Signed Proposals".
- Replace the shadcn table with the same aligned row-grid used on the proposals list: pastel rounded card surface, black outlines, columns for Recipient, Subject, Price (right-aligned tabular figures), Status, Signed date, Signer, and a round black arrow/View action.
- Rounded outlined search input in the same style.
- Pastel status chips ("Signed - Payment Pending" / "Completed") instead of default badges.
- Styled loading and empty states.
- Pagination at 10 rows per page, matching the proposals list.

## Unchanged
All data fetching, signature lookups, search logic, navigation to proposal details, and permissions stay exactly as they are.
