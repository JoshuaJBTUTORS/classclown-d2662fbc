## Step 1: Auto-create parent from a completed proposal

Replace the "Open parent form" button with a searchable picker of completed proposals. Selecting one calls the same `create-parent-account` edge function used by `AddParentOnlyForm` — no manual form, no new backend logic.

### UX
- Step 1 card shows a searchable Combobox: "Select a completed proposal".
- Options list shows recipient name + email + completion date, sourced from `lesson_proposals` where `status = 'completed'` AND `parent_id IS NULL` (hide proposals whose parent has already been created).
- Selecting a proposal shows a small preview (name, email, phone) and a "Create parent account" button.
- Clicking it calls `supabase.functions.invoke('create-parent-account', { body: { first_name, last_name, email, phone } })` — same defaults (password `classbeyond123!`, auto-confirm) as the existing flow.
- On success: mark step 1 complete, show a green tick with the created parent's email, and unlock "Continue".

### Data mapping
- `recipient_name` → split on first space → `first_name` + `last_name` (fallback: whole string as first_name).
- `recipient_email` → `email`.
- `recipient_phone` → `phone`.
- After the edge function succeeds, link the proposal to the new parent: `UPDATE lesson_proposals SET parent_id = <new parent id> WHERE id = <proposal id>` so it disappears from the picker.

### Files
1. **`src/pages/Onboarding.tsx`** — replace Step 1 body: swap the "Open parent form" button for the proposal picker + preview + create button. Remove the `AddParentOnlyForm` dialog usage on this step (keep the import removed).
2. No edge function changes. No schema changes.

### Out of scope
- Steps 2+ remain placeholder.
- Any student/lesson creation from the proposal (future step).