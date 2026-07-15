
## Changes to `src/components/proposals/ProposalLayout.tsx`

### 1. Add 24-hour countdown timer next to "ClassBeyond" in the top-left header

- Compute a deadline as `proposal.created_at + 24 hours`.
- Add a small `useEffect` + `useState` that ticks every second and formats remaining time as `HHh MMm SSs` (or `MMm SSs` when under an hour). When expired, show `Expired`.
- Render a subtle pill immediately to the right of the ClassBeyond wordmark inside the sticky header (`border border-primary/30 bg-primary/5 text-primary`, small text, rounded-full, with a clock icon).
- Hide the pill entirely when the proposal is already `signed` (no urgency needed once signed).

### 2. Fix the mobile header (currently overflows)

Current issues on mobile:
- The action row (`Contact us`, `Print`, `Confirm & get started`) is too wide → causes overshoot.
- The section pills strip is a horizontal-scroll bar that visually bleeds off-screen.

Fixes:
- In the top action bar (`<header>`):
  - On mobile (`<md`), collapse `Contact us` / `Print` / (and `Confirm & get started` when appropriate) into a single **dropdown menu** using `@/components/ui/dropdown-menu` (already used elsewhere) triggered by a `Menu` icon button. Keep `Confirm & get started` visible as the primary CTA only if there's room, otherwise place it inside the dropdown too. The countdown pill stays visible on mobile (compact form).
  - Keep the existing desktop layout (`md:flex`) unchanged.
- Replace the fixed overflow-scroll pills nav with a **mobile section dropdown**:
  - Remove the `fixed inset-x-0 top-16 ... overflow-x-auto` pills strip.
  - Add a compact `Select`-style dropdown ("Jump to section ▾") that sits inline at the top of `<main>` on mobile only (`lg:hidden`). Selecting an option scrolls to that section (`document.getElementById(id)?.scrollIntoView({behavior:'smooth'})`). The current section (from the existing IntersectionObserver `active` state) is shown as the trigger label.
  - Because we're removing the fixed pills bar, drop the `pt-16 lg:pt-0` top padding on `<main>`.

### Technical notes

- Countdown uses `setInterval(..., 1000)` cleared on unmount; deadline stored in `useMemo` from `proposal.created_at`.
- Dropdown menu items reuse existing button handlers (`onConfirm`, `window.print()`, `mailto:` link).
- No changes to business logic, data, or other components.
