## Goal

Give tutors a fallback way to access the Self-Employed Online Tutor Agreement in case the "Open / Download Contract" popup is blocked or the new tab fails to open.

## Change

In `src/pages/OfferView.tsx`, inside the contract card (around lines 181–187), alongside the existing **Open / Download Contract** button:

1. Show the contract URL in a read-only input field so it's visible and selectable.
2. Add a **Copy link** button next to it that copies `CONTRACT_URL` to the clipboard via `navigator.clipboard.writeText`, with a toast confirmation ("Contract link copied").
3. Clicking **Copy link** also marks the contract as viewed (`setContractViewed(true)`) so the "I have read the contract" checkbox becomes enabled — matching the current behavior of the Open button, since users using the copy path won't trigger the target=_blank click.

No other logic, styling system, or signing flow changes.
